"use client";

import { useState } from "react";
import { BookOpen, Plus, X } from "lucide-react";
import { SEP, WHEEL, type WheelNode } from "@/lib/flavorWheel";
import { tagColor, tagLabel } from "@/lib/constants";
import FlavorWheelSheet from "./FlavorWheelSheet";

/**
 * 컵노트 고르기: 9개 큰 범주 → 펼치면 2·3단계 용어.
 * 어느 단계든 고를 수 있다(“과일”만 느껴지면 과일, 더 구체적이면 블루베리).
 */
export default function CupNotePicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [wheel, setWheel] = useState(false);
  const [custom, setCustom] = useState("");

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  const countIn = (top: string) => value.filter((v) => v === top || v.startsWith(top + SEP)).length;
  const top = WHEEL.find((t) => t.en === open);

  function addCustom() {
    const t = custom.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setCustom("");
  }

  const chip = (id: string, label: string, color: string, strong = false) => {
    const on = value.includes(id);
    return (
      <button
        key={id}
        type="button"
        onClick={() => toggle(id)}
        className={`rounded-full border px-3 py-2 text-sm ${strong ? "font-bold" : ""}`}
        style={on ? { background: color, borderColor: color, color: "#fff" } : { borderColor: color + "55", color, background: color + "0d" }}
      >
        {label}
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

      {/* 9개 범주 */}
      <div className="grid grid-cols-3 gap-1.5">
        {WHEEL.map((t) => {
          const on = open === t.en;
          const c = countIn(t.en);
          return (
            <button
              key={t.en}
              type="button"
              onClick={() => setOpen(on ? null : t.en)}
              className="relative rounded-xl border-2 px-1 py-2.5 text-sm font-bold"
              style={on ? { background: t.color, borderColor: t.color, color: "#fff" } : { borderColor: t.color + "66", color: t.color, background: "#fffdf9" }}
            >
              {t.ko}
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
        })}
      </div>

      {/* 펼친 범주 */}
      {top && (
        <div className="mt-2 rounded-2xl border bg-card p-3" style={{ borderColor: top.color + "55" }}>
          <div className="mb-2 flex flex-wrap gap-1.5">{chip(top.en, `${top.ko} 전체`, top.color, true)}</div>
          <div className="space-y-2.5">
            {top.children!.map((sub: WheelNode) => {
              const sid = top.en + SEP + sub.en;
              return (
                <div key={sid} className="flex flex-wrap items-center gap-1.5">
                  {chip(sid, sub.ko, top.color, true)}
                  {sub.children?.map((leaf) => chip(sid + SEP + leaf.en, leaf.ko, top.color))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-2 flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          placeholder="휠에 없는 노트 직접 입력 (예: 홍시)"
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
