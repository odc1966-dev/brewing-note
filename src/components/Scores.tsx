"use client";

import { Minus, Plus } from "lucide-react";
import { Stars } from "./ui";

/**
 * 평가 항목: 별점(종합) · 클린컵 · 밸런스. 모두 0~5점, 0.5점 단위.
 * 클린컵·밸런스는 SCA(SCAA) 커핑 양식의 항목 이름을 빌렸지만, 척도는 홈 기록용으로 별점과 같게 단순화했다
 * (커핑 양식: 클린컵 = 5컵 각 2점 최대 10점, 밸런스 = 6~10점).
 */
export const SCORE_ITEMS = [
  { key: "cleanCup", label: "클린컵", en: "Clean Cup", desc: "처음 한 모금부터 여운까지 거슬리는 맛(잡맛) 없이 맑은 정도" },
  { key: "balance", label: "밸런스", en: "Balance", desc: "향미·산미·바디·여운이 서로 잘 어우러지는 정도" },
] as const;

export type ScoreKey = (typeof SCORE_ITEMS)[number]["key"];

const clamp = (v: number) => Math.max(0, Math.min(5, Math.round(v * 2) / 2));

function Stepper({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        aria-label={`${label} 0.5점 내리기`}
        disabled={value <= 0}
        onClick={() => onChange(clamp(value - 0.5))}
        className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card disabled:opacity-30"
      >
        <Minus size={18} />
      </button>
      <span className="w-10 text-center text-lg font-extrabold tabular-nums" aria-live="polite">
        {value ? value.toFixed(1) : "–"}
      </span>
      <button
        type="button"
        aria-label={`${label} 0.5점 올리기`}
        disabled={value >= 5}
        onClick={() => onChange(clamp(value + 0.5))}
        className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card disabled:opacity-30"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}

/** 동그라미 5개(반쪽 채움) — 누른 동그라미의 왼쪽 절반 = .5점 */
function Dots({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center" role="slider" aria-label={`${label} ${value}점`} aria-valuenow={value} aria-valuemin={0} aria-valuemax={5}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <button
            key={i}
            type="button"
            aria-label={`${label} ${i}점`}
            className="p-1"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const v = e.clientX - r.left < r.width / 2 ? i - 0.5 : i;
              onChange(v === value ? 0 : v);
            }}
          >
            <span className="relative block h-6 w-6 overflow-hidden rounded-full border-2 border-accent/60 bg-card">
              <span className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${fill * 100}%` }} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export interface EvalValue {
  rating: number;
  cleanCup?: number;
  balance?: number;
}

/** 기록 화면의 평가 칸 */
export function EvalSection({ value, onChange }: { value: EvalValue; onChange: (p: Partial<EvalValue>) => void }) {
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-card p-3">
      <div>
        <div className="mb-1 flex items-baseline gap-2 px-1">
          <span className="font-bold">별점</span>
          <span className="text-xs text-sub">종합 · 별 왼쪽 절반을 누르거나 −/+ 로 0.5점씩</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Stars value={value.rating} onChange={(rating) => onChange({ rating })} size={30} />
          <Stepper value={value.rating} onChange={(rating) => onChange({ rating })} label="별점" />
        </div>
      </div>
      {SCORE_ITEMS.map((it) => {
        const v = value[it.key] ?? 0;
        return (
          <div key={it.key} className="border-t border-line pt-3">
            <div className="mb-1 px-1">
              <span className="font-bold">{it.label}</span> <span className="text-xs text-sub">{it.en}</span>
              <p className="text-xs text-sub">{it.desc}</p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Dots value={v} onChange={(n) => onChange({ [it.key]: n })} label={it.label} />
              <Stepper value={v} onChange={(n) => onChange({ [it.key]: n })} label={it.label} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** 상세 화면용 작은 표시: "클린컵 4.5 · 밸런스 4.0" */
export function ScoreChips({ value }: { value: EvalValue }) {
  const items = SCORE_ITEMS.filter((it) => (value[it.key] ?? 0) > 0);
  if (!items.length) return null;
  return (
    <div className="mt-2 flex justify-center gap-1.5">
      {items.map((it) => (
        <span key={it.key} className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
          {it.label} {(value[it.key] ?? 0).toFixed(1)}
        </span>
      ))}
    </div>
  );
}

export function scoreLine(value: EvalValue) {
  return SCORE_ITEMS.filter((it) => (value[it.key] ?? 0) > 0)
    .map((it) => `${it.label} ${(value[it.key] ?? 0).toFixed(1)}`)
    .join(" · ");
}
