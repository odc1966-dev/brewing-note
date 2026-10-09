"use client";

import { Minus, Plus } from "lucide-react";
import { Stars } from "./ui";

/**
 * 점수 입력 부품. 모든 점수는 0~5점, 0.5점 단위.
 * 클린컵·밸런스는 SCA(SCAA) 커핑 양식의 항목 이름을 빌렸지만, 척도는 홈 기록용으로 별점과 같게 단순화했다
 * (커핑 양식: 클린컵 = 5컵 각 2점 최대 10점, 밸런스 = 6~10점).
 */
export const SCORE_ITEMS = [
  { key: "cleanCup", label: "클린컵", en: "Clean Cup", desc: "처음 한 모금부터 여운까지 거슬리는 맛(잡맛) 없이 맑은 정도" },
  { key: "balance", label: "밸런스", en: "Balance", desc: "향미·산미·바디·여운이 서로 잘 어우러지는 정도" },
] as const;

export type ScoreKey = (typeof SCORE_ITEMS)[number]["key"];

export const clampHalf = (v: number) => Math.max(0, Math.min(5, Math.round(v * 2) / 2));

/** −  4.5  + */
export function Stepper({ value, onChange, label, small = false }: { value: number; onChange: (v: number) => void; label: string; small?: boolean }) {
  const btn = `grid place-items-center rounded-full border border-line bg-card disabled:opacity-30 ${small ? "h-9 w-9" : "h-10 w-10"}`;
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button type="button" aria-label={`${label} 0.5점 내리기`} disabled={value <= 0} onClick={() => onChange(clampHalf(value - 0.5))} className={btn}>
        <Minus size={small ? 16 : 18} />
      </button>
      <span className={`text-center font-extrabold tabular-nums ${small ? "w-8 text-base" : "w-10 text-lg"}`} aria-live="polite">
        {value ? value.toFixed(1) : "–"}
      </span>
      <button type="button" aria-label={`${label} 0.5점 올리기`} disabled={value >= 5} onClick={() => onChange(clampHalf(value + 0.5))} className={btn}>
        <Plus size={small ? 16 : 18} />
      </button>
    </div>
  );
}

/** 동그라미 5개(반쪽 채움) — 누른 동그라미의 왼쪽 절반 = .5점, 같은 점수를 다시 누르면 0 */
export function Dots({ value, onChange, label, small = false }: { value: number; onChange: (v: number) => void; label: string; small?: boolean }) {
  return (
    <div className="flex items-center" role="slider" aria-label={`${label} ${value}점`} aria-valuenow={value} aria-valuemin={0} aria-valuemax={5}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <button
            key={i}
            type="button"
            aria-label={`${label} ${i}점`}
            className={small ? "p-[3px]" : "p-1"}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const v = e.clientX - r.left < r.width / 2 ? i - 0.5 : i;
              onChange(v === value ? 0 : v);
            }}
          >
            <span className={`relative block overflow-hidden rounded-full border-2 border-accent/60 bg-card ${small ? "h-[22px] w-[22px]" : "h-6 w-6"}`}>
              <span className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${fill * 100}%` }} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** 한 줄 점수: 이름 · 동그라미 · −/+ */
export function ScoreRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="w-11 shrink-0 text-sm font-semibold">{label}</span>
      <div className="flex flex-1 justify-center">
        <Dots value={value} onChange={onChange} label={label} small />
      </div>
      <Stepper value={value} onChange={onChange} label={label} small />
    </div>
  );
}

export interface EvalValue {
  rating: number;
  cleanCup?: number;
  balance?: number;
}

/** 기록 화면의 별점 칸 */
export function RatingSection({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <Stars value={value} onChange={onChange} size={30} />
        <Stepper value={value} onChange={onChange} label="별점" />
      </div>
    </div>
  );
}

/** 플레이버 프로필 아래에 두는 클린컵·밸런스(오각형에는 들어가지 않음) */
export function ExtraScores({ value, onChange }: { value: EvalValue; onChange: (p: Partial<EvalValue>) => void }) {
  return (
    <div className="mt-3 space-y-2 border-t border-line pt-3">
      {SCORE_ITEMS.map((it) => (
        <div key={it.key}>
          <ScoreRow label={it.label} value={value[it.key] ?? 0} onChange={(n) => onChange({ [it.key]: n })} />
          <p className="mt-0.5 pl-12 text-[11px] leading-snug text-sub">{it.desc}</p>
        </div>
      ))}
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
