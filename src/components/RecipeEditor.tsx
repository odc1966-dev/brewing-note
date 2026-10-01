"use client";

import { useState } from "react";
import { BookmarkPlus, ChevronDown, ChevronUp, FolderOpen, Plus, Trash2 } from "lucide-react";
import { saveSettings, useStore } from "@/lib/store";
import { POUR_STYLES, cloneSteps, cumulative, flow, newStep, recipeTotal } from "@/lib/recipe";
import type { RecipeStep, SavedRecipe } from "@/lib/types";
import { mmss, parseTime, uid } from "@/lib/util";
import { GhostButton, Label, Modal, PrimaryButton, TextInput } from "./ui";

/** 숫자 칸: 입력 중인 글자는 그대로 두고, 바뀔 때마다 숫자로 알려 준다 */
function Field({
  label,
  unit,
  init,
  parse,
  onValue,
  placeholder,
  mode = "numeric",
}: {
  label: string;
  unit?: string;
  init: string;
  parse: (s: string) => number | null;
  onValue: (n: number | null) => void;
  placeholder?: string;
  mode?: "numeric" | "text" | "decimal";
}) {
  const [t, setT] = useState(init);
  return (
    <label className="block min-w-0 rounded-lg border border-line bg-bg px-2 py-1.5 focus-within:border-accent">
      <span className="block text-[10px] text-sub">{label}</span>
      <span className="flex items-baseline gap-0.5">
        <input
          value={t}
          inputMode={mode}
          placeholder={placeholder}
          onChange={(e) => {
            setT(e.target.value);
            onValue(e.target.value.trim() === "" ? null : parse(e.target.value));
          }}
          className="w-full min-w-0 bg-transparent text-[15px] font-bold outline-none placeholder:font-normal placeholder:text-sub/50"
        />
        {unit && <span className="text-xs text-sub">{unit}</span>}
      </span>
    </label>
  );
}

const intOrNull = (s: string) => {
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : null;
};

function StepCard({
  step,
  index,
  total,
  cum,
  onChange,
  onRemove,
  onMove,
}: {
  step: RecipeStep;
  index: number;
  total: number;
  cum: number;
  onChange: (s: RecipeStep) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const f = flow(step);
  const set = (p: Partial<RecipeStep>) => onChange({ ...step, ...p });
  return (
    <div className="rounded-xl border border-line bg-card p-2.5">
      <div className="mb-2 flex items-center gap-1">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-espresso text-xs font-bold text-white">{index + 1}</span>
        <input
          value={step.label}
          onChange={(e) => set({ label: e.target.value })}
          aria-label="단계 이름"
          className="min-w-0 flex-1 bg-transparent px-1 font-bold outline-none"
        />
        <span className="shrink-0 text-xs text-sub">누적 {cum}g</span>
        <button type="button" aria-label="위로" disabled={index === 0} onClick={() => onMove(-1)} className="grid h-8 w-7 place-items-center text-sub disabled:opacity-25">
          <ChevronUp size={18} />
        </button>
        <button type="button" aria-label="아래로" disabled={index === total - 1} onClick={() => onMove(1)} className="grid h-8 w-7 place-items-center text-sub disabled:opacity-25">
          <ChevronDown size={18} />
        </button>
        <button type="button" aria-label="단계 삭제" onClick={onRemove} className="grid h-8 w-7 place-items-center text-red-700">
          <Trash2 size={16} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <Field label="시작 (분:초)" init={step.at !== null ? mmss(step.at) : ""} parse={parseTime} onValue={(at) => set({ at })} mode="text" placeholder="0:45" />
        <Field label="이번 물량" unit="g" init={step.amount?.toString() ?? ""} parse={intOrNull} onValue={(amount) => set({ amount })} placeholder="60" />
        <Field
          label={f ? `붓는 시간 · ${f}g/초` : "붓는 시간"}
          unit="초"
          init={step.duration?.toString() ?? ""}
          parse={intOrNull}
          onValue={(duration) => set({ duration })}
          placeholder="10"
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {POUR_STYLES.map((p) => {
          const on = step.styles.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              title={p.desc}
              aria-pressed={on}
              onClick={() => set({ styles: on ? step.styles.filter((x) => x !== p.id) : [...step.styles, p.id] })}
              className={`rounded-full border px-2.5 py-1.5 text-xs ${on ? "border-accent bg-accent text-white" : "border-line bg-bg text-sub"}`}
            >
              {p.id}
            </button>
          );
        })}
      </div>
      <input
        value={step.memo}
        onChange={(e) => set({ memo: e.target.value })}
        placeholder="메모 (예: 물줄기 가늘게, 스월 1회)"
        className="mt-2 w-full rounded-lg border border-line bg-bg px-2.5 py-2 text-sm outline-none focus:border-accent"
      />
    </div>
  );
}

export interface RecipeBase {
  method: string;
  dose: number | null;
  water: number | null;
  temp: number | null;
  grind: string;
}

export default function RecipeEditor({
  steps,
  onChange,
  base,
  onLoad,
  onSetWater,
}: {
  steps: RecipeStep[];
  onChange: (s: RecipeStep[]) => void;
  base: RecipeBase; // 지금 기록의 추출 변수(저장할 때 같이 저장)
  onLoad: (r: SavedRecipe) => void; // 불러오기: 추출 변수까지 채운다
  onSetWater: (g: number) => void;
}) {
  const recipes = useStore((s) => s.settings.recipes) ?? [];
  const [open, setOpen] = useState(steps.length > 0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [help, setHelp] = useState(false);

  const cum = cumulative(steps);
  const total = recipeTotal(steps);
  const mismatch = steps.length > 0 && total > 0 && base.water !== null && Math.abs(total - base.water) >= 1;

  const update = (i: number, s: RecipeStep) => onChange(steps.map((x, j) => (j === i ? s : x)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...steps];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  async function saveRecipe() {
    const r: SavedRecipe = { id: uid(), name: name.trim(), ...base, steps: cloneSteps(steps), createdAt: Date.now() };
    await saveSettings({ recipes: [...recipes, r] });
    setSaving(false);
    setName("");
  }

  if (!open) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <GhostButton
          onClick={() => {
            setOpen(true);
            if (!steps.length) onChange([newStep([], base.dose)]);
          }}
        >
          <Plus size={18} /> 레시피 적기
        </GhostButton>
        <GhostButton onClick={() => setLoading(true)} disabled={!recipes.length}>
          <FolderOpen size={18} /> 내 레시피 {recipes.length}
        </GhostButton>
        <LoadSheet open={loading} recipes={recipes} onClose={() => setLoading(false)} onPick={(r) => (onLoad(r), setOpen(true), setLoading(false))} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-bg/60 p-2.5">
      <div className="mb-2 flex items-center gap-2 px-1 text-xs text-sub">
        <span className="flex-1">
          {steps.length}단계 · 합계 <b className="text-ink">{total}g</b>
          {base.water ? ` / 물 ${base.water}g` : ""}
        </span>
        <button type="button" onClick={() => setHelp((v) => !v)} className="underline">
          붓는 방식 설명
        </button>
      </div>
      {help && (
        <ul className="mb-2 space-y-0.5 rounded-xl bg-card px-3 py-2 text-xs text-sub">
          {POUR_STYLES.map((p) => (
            <li key={p.id}>
              <b className="text-ink">{p.id}</b> — {p.desc}
            </li>
          ))}
        </ul>
      )}
      {mismatch && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-xs text-orange-800">
          <span className="flex-1">레시피 합계({total}g)가 물({base.water}g)과 달라요.</span>
          <button type="button" onClick={() => onSetWater(total)} className="shrink-0 rounded-lg bg-orange-700 px-2 py-1 font-semibold text-white">
            물을 {total}g으로
          </button>
        </div>
      )}

      <div className="space-y-2">
        {steps.map((s, i) => (
          <StepCard
            key={s.id}
            step={s}
            index={i}
            total={steps.length}
            cum={cum[i]}
            onChange={(n) => update(i, n)}
            onRemove={() => onChange(steps.filter((_, j) => j !== i))}
            onMove={(d) => move(i, d)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange([...steps, newStep(steps, base.dose)])}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-accent py-3 text-sm font-semibold text-accent"
      >
        <Plus size={16} /> {steps.length ? `${steps.filter((s) => s.label !== "뜸 들이기").length + 1}차 푸어 추가` : "뜸 들이기 추가"}
      </button>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <GhostButton className="!py-2.5 text-sm" onClick={() => setLoading(true)} disabled={!recipes.length}>
          <FolderOpen size={16} /> 불러오기
        </GhostButton>
        <GhostButton className="!py-2.5 text-sm" onClick={() => setSaving(true)} disabled={!steps.length}>
          <BookmarkPlus size={16} /> 내 레시피로 저장
        </GhostButton>
      </div>

      <LoadSheet open={loading} recipes={recipes} onClose={() => setLoading(false)} onPick={(r) => (onLoad(r), setLoading(false))} />

      <Modal open={saving} onClose={() => setSaving(false)}>
        <h2 className="text-center text-[17px] font-bold">내 레시피로 저장</h2>
        <p className="mt-1 text-center text-xs text-sub">
          단계와 함께 지금의 추출 변수({[base.method, base.dose && `${base.dose}g`, base.water && `${base.water}g`, base.temp && `${base.temp}°C`, base.grind].filter(Boolean).join(" · ")})도 저장돼요.
        </p>
        <Label>레시피 이름</Label>
        <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 에티오피아용 5회 푸어" />
        <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
          <GhostButton onClick={() => setSaving(false)}>취소</GhostButton>
          <PrimaryButton onClick={saveRecipe} disabled={!name.trim()}>
            저장
          </PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}

function LoadSheet({ open, recipes, onClose, onPick }: { open: boolean; recipes: SavedRecipe[]; onClose: () => void; onPick: (r: SavedRecipe) => void }) {
  const [armed, setArmed] = useState<string | null>(null);
  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-center text-[17px] font-bold">내 레시피</h2>
      <p className="mt-1 text-center text-xs text-sub">고르면 단계와 추출 변수(원두량·물·수온·분쇄도)를 채워요.</p>
      <div className="mt-3 space-y-2">
        {recipes.length === 0 && <p className="py-6 text-center text-sm text-sub">저장한 레시피가 없어요.</p>}
        {recipes
          .slice()
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((r) => (
            <div key={r.id} className="flex items-center gap-2 rounded-2xl border border-line bg-card p-3">
              <button type="button" onClick={() => onPick(r)} className="min-w-0 flex-1 text-left">
                <span className="block truncate font-semibold">{r.name}</span>
                <span className="block truncate text-xs text-sub">
                  {[r.method, r.dose && r.water ? `${r.dose}g · ${r.water}g` : "", `${r.steps.length}단계`, r.temp ? `${r.temp}°C` : "", r.grind].filter(Boolean).join(" · ")}
                </span>
              </button>
              <button
                type="button"
                aria-label="레시피 삭제"
                onClick={() => {
                  if (armed !== r.id) return setArmed(r.id);
                  saveSettings({ recipes: recipes.filter((x) => x.id !== r.id) });
                  setArmed(null);
                }}
                className={`shrink-0 rounded-lg px-2 py-1.5 text-xs ${armed === r.id ? "bg-red-700 text-white" : "text-red-700"}`}
              >
                {armed === r.id ? "한 번 더" : <Trash2 size={16} />}
              </button>
            </div>
          ))}
      </div>
      <GhostButton className="mt-3 w-full" onClick={onClose}>
        닫기
      </GhostButton>
    </Modal>
  );
}
