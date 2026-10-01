import type { Bean, Brew } from "./types";

export interface Stock {
  weight: number;
  used: number;
  remaining: number;
  pct: number; // 0~1
  avgDose: number | null;
  cupsLeft: number | null;
  low: boolean;
  empty: boolean;
}

/**
 * 남은 양 = 구입 용량 − 이 원두로 내린 원두량 합 + 직접 맞춘 보정값.
 * 기록을 고치거나 지우면 자동으로 다시 계산된다.
 */
export function stockOf(bean: Bean, brews: Brew[]): Stock | null {
  if (!bean.weight) return null;
  const mine = brews.filter((b) => b.beanId === bean.id && b.dose);
  const used = mine.reduce((s, b) => s + (b.dose ?? 0), 0);
  const remaining = Math.max(0, Math.round((bean.weight - used + (bean.stockAdjust ?? 0)) * 10) / 10);
  const recent = mine.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  const avgDose = recent.length ? recent.reduce((s, b) => s + (b.dose ?? 0), 0) / recent.length : null;
  const cupsLeft = avgDose ? Math.floor(remaining / avgDose) : null;
  return {
    weight: bean.weight,
    used,
    remaining,
    pct: Math.max(0, Math.min(1, remaining / bean.weight)),
    avgDose,
    cupsLeft,
    // 두 잔 미만 남았거나(평균 원두량 기준) 15% 이하
    low: remaining > 0 && ((cupsLeft !== null && cupsLeft < 2) || remaining / bean.weight <= 0.15),
    empty: remaining <= 0,
  };
}

/** 직접 맞춘 남은 양 → 보정값 */
export function adjustFor(bean: Bean, brews: Brew[], actualRemaining: number) {
  const used = brews.filter((b) => b.beanId === bean.id).reduce((s, b) => s + (b.dose ?? 0), 0);
  return Math.round((actualRemaining - ((bean.weight ?? 0) - used)) * 10) / 10;
}
