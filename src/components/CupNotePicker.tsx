"use client";

import { useMemo, useState } from "react";
import { BookOpen, Check, Plus, Search, X } from "lucide-react";
import { COLOR_NOTES, IMPRESSION, SEP, WHEEL, searchTags, type WheelNode } from "@/lib/flavorWheel";
import { tagColor, tagLabel } from "@/lib/constants";
import FlavorWheelSheet from "./FlavorWheelSheet";

type Top = WheelNode & { color: string };
const visible = (n: WheelNode) => !n.defect;

/**
 * 컵노트 고르기: 큰 갈래(SCA 9분류 + 질감·인상) → 펼치면 중간 갈래와 세부 노트.
 * 어느 단계든 고를 수 있다(“과일”만 느껴지면 과일, 더 구체적이면 블루베리).
 * 점선 테두리 = SCA 휠에 없는 추가 표현.
 */
export default function CupNotePicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [wheel, setWheel] = useState(false);
  const [custom, setCustom] = useState("");
  const [q, setQ] = useState("");
  // 처음엔 색 노트만 고른 기록이면 색 화면으로 연다
  const [mode, setMode] = useState<"note" | "color">(() =>
    value.length > 0 && value.every((v) => v.startsWith("Color" + SEP)) ? "color" : "note",
  );
  const colorCount = value.filter((v) => v.startsWith("Color" + SEP)).length;

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  const countIn = (top: string) => value.filter((v) => v === top || v.startsWith(top + SEP)).length;
  const top: Top | undefined = [...WHEEL, IMPRESSION].find((t) => t.en === open);
  const results = useMemo(() => searchTags(q), [q]);

  function addCustom() {
    const t = custom.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setCustom("");
  }

  const chip = (id: string, label: string, color: string, opts: { strong?: boolean; extra?: boolean } = {}) => {
    const on = value.includes(id);
    return (
      <button
        key={id}
        type="button"
        onClick={() => toggle(id)}
        aria-pressed={on}
        className={`rounded-full border px-3 py-2 text-sm ${opts.strong ? "font-bold" : ""} ${opts.extra && !on ? "border-dashed" : ""}`}
        style={on ? { background: color, borderColor: color, color: "#fff" } : { borderColor: color + "66", color, background: color + "0d" }}
      >
        {label}
      </button>
    );
  };

  const catButton = (t: Top, wide = false) => {
    const on = open === t.en;
    const c = countIn(t.en);
    return (
      <button
        key={t.en}
        type="button"
        onClick={() => setOpen(on ? null : t.en)}
        aria-expanded={on}
        className={`relative rounded-xl border-2 px-1 py-2.5 text-sm font-bold ${wide ? "col-span-3" : ""}`}
        style={on ? { background: t.color, borderColor: t.color, color: "#fff" } : { borderColor: t.color + "66", color: t.color, background: "#fffdf9" }}
      >
        {t.ko}
        {wide && <span className="ml-1 font-normal opacity-80">— 질감 · 산미 성격 · 여운</span>}
        {c > 0 && (
          <span
            className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] text-white"
            style={{ background: on ? "#3a2a20" : t.color }}
          >
            {c}
          </span>
        )}
      </button>
    );
  };

  return (
    <div>
      {/* 고른 노트 */}
      {value.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {value.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              aria-label={`${tagLabel(id)} 빼기`}
              className="flex items-center gap-1 rounded-full py-1.5 pl-3 pr-2 text-sm font-semibold text-white"
              style={{ background: tagColor(id) }}
            >
              {tagLabel(id)} <X size={14} />
            </button>
          ))}
        </div>
      )}

      {/* 노트로 / 색으로 */}
      <div className="mb-2 flex rounded-xl bg-cream p-1" role="tablist" aria-label="컵노트 고르는 방식">
        {(
          [
            ["note", "노트로", "블루베리·캐러멜처럼 구체적으로"],
            ["color", `색으로${colorCount ? ` · ${colorCount}` : ""}`, "떠오르는 색으로 가볍게"],
          ] as const
        ).map(([id, label, sub]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={`flex-1 rounded-lg px-2 py-2 text-center ${mode === id ? "bg-espresso text-white shadow" : "text-sub"}`}
          >
            <span className="block text-sm font-semibold">{label}</span>
            <span className={`block text-[10px] ${mode === id ? "text-white/75" : "text-sub/80"}`}>{sub}</span>
          </button>
        ))}
      </div>

      {mode === "color" ? (
        <div className="rounded-2xl border border-line bg-card p-3">
          <div className="grid grid-cols-3 gap-2">
            {COLOR_NOTES.map((c) => {
              const id = "Color" + SEP + c.en;
              const on = value.includes(id);
              return (
                <button
                  key={c.en}
                  type="button"
                  aria-pressed={on}
                  aria-label={`${c.ko} 계열 — ${c.hint}`}
                  onClick={() => toggle(id)}
                  className={`flex flex-col items-center rounded-xl border-2 px-1 pb-2 pt-2.5 ${on ? "border-espresso bg-cream" : "border-transparent"}`}
                >
                  <span
                    className="relative grid h-12 w-12 place-items-center rounded-full shadow-inner"
                    style={{ background: c.swatch, border: c.en === "White" ? "1px solid #d8cdbb" : undefined }}
                  >
                    {on && <Check size={22} strokeWidth={3} color={["White", "Yellow", "Pink"].includes(c.en) ? "#3a2a20" : "#fff"} />}
                  </span>
                  <span className="mt-1.5 text-sm font-bold">{c.ko}</span>
                  <span className="mt-0.5 text-center text-[10px] leading-snug text-sub">{c.hint}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] leading-snug text-sub">
            맛이 어떤 색을 떠올리게 하는지 골라요. 여러 색을 함께 골라도 되고, ‘노트로’에서 고른 노트와 섞어도 돼요. 색과 예시는 앱에서 정한 묶음이에요.
          </p>
        </div>
      ) : (
      <>
      {/* 검색 */}
      <label className="mb-2 flex items-center gap-2 rounded-xl border border-line bg-card px-3 focus-within:border-accent">
        <Search size={17} className="shrink-0 text-sub" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="노트 찾기 (예: 복숭아, 얼그레이, peach)"
          className="w-full bg-transparent py-2.5 text-[15px] outline-none"
        />
        {q && (
          <button type="button" aria-label="검색어 지우기" onClick={() => setQ("")} className="text-sub">
            <X size={16} />
          </button>
        )}
      </label>

      {q.trim() ? (
        <div className="rounded-2xl border border-line bg-card p-3">
          {results.length === 0 ? (
            <p className="text-sm text-sub">
              찾는 노트가 없어요. 아래 칸에 직접 적어 추가할 수 있어요.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {results.map((e) => (
                <span key={e.id} className="inline-flex flex-col items-start">
                  {chip(e.id, e.ko, e.color, { extra: e.extra })}
                  <span className="mt-0.5 px-1 text-[10px] text-sub">{e.path.slice(0, -1).join(" › ")}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 큰 갈래 */}
          <div className="grid grid-cols-3 gap-1.5">
            {WHEEL.map((t) => catButton(t))}
            {catButton(IMPRESSION, true)}
          </div>

          {/* 펼친 갈래 */}
          {top && (
            <div className="mt-2 rounded-2xl border bg-card p-3" style={{ borderColor: top.color + "55" }}>
              {top !== IMPRESSION && <div className="mb-2 flex flex-wrap gap-1.5">{chip(top.en, `${top.ko} 전체`, top.color, { strong: true })}</div>}
              <div className="space-y-3">
                {top.children!.filter(visible).map((sub) => {
                  const sid = top.en + SEP + sub.en;
                  const leaves = sub.children?.filter(visible) ?? [];
                  return (
                    <div key={sid} className="flex flex-wrap items-center gap-1.5">
                      {chip(sid, sub.ko, top.color, { strong: true, extra: sub.extra })}
                      {leaves.map((leaf) => chip(sid + SEP + leaf.en, leaf.ko, top.color, { extra: leaf.extra }))}
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-sub">
                실선 = SCA 플레이버 휠 용어 · 점선 = 로스터리에서 흔히 쓰는 추가 표현
              </p>
            </div>
          )}
        </>
      )}
      </>
      )}

      <div className="mt-2 flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          placeholder="목록에 없는 노트 직접 입력"
          className="min-w-0 flex-1 rounded-xl border border-line bg-card px-3 py-2.5 text-[15px] outline-none focus:border-accent"
        />
        <button type="button" onClick={addCustom} aria-label="직접 입력한 노트 추가" className="grid w-11 place-items-center rounded-xl border border-line bg-card">
          <Plus size={18} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setWheel(true)}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-cream py-3 text-sm font-semibold text-espresso"
      >
        <BookOpen size={17} /> 플레이버 휠 보기
      </button>

      <FlavorWheelSheet open={wheel} onClose={() => setWheel(false)} />
    </div>
  );
}
