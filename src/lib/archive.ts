// 다 마신 원두 보관함: 옮기기 · 다시 꺼내기 · 원두별 요약
import { adjustFor } from "./stock";
import { upsert } from "./store";
import type { Bean, Brew } from "./types";

export function archiveBean(bean: Bean) {
  return upsert("beans", { ...bean, archived: true, archivedAt: Date.now() });
}

/** 다시 꺼내기. refill 이면 새 봉투로 보고 남은 양을 구입 용량만큼 다시 채운다 */
export function restoreBean(bean: Bean, brews: Brew[], refill: boolean) {
  const next: Bean = { ...bean, archived: false, archivedAt: undefined };
  if (refill && bean.weight) next.stockAdjust = adjustFor(bean, brews, bean.weight);
  return upsert("beans", next);
}

export interface BeanSummary {
  cups: number;
  avgRating: number | null;
  best: Brew | undefined; // 별점이 가장 높은 기록(같으면 최근 것)
  firstDate: string | null;
  lastDate: string | null;
}

export function summarize(beanId: string, brews: Brew[]): BeanSummary {
  const mine = brews.filter((b) => b.beanId === beanId);
  const rated = mine.filter((b) => b.rating > 0);
  const dates = mine.map((b) => b.date).sort();
  const best = rated.slice().sort((a, b) => b.rating - a.rating || b.date.localeCompare(a.date))[0];
  return {
    cups: mine.length,
    avgRating: rated.length ? rated.reduce((s, b) => s + b.rating, 0) / rated.length : null,
    best,
    firstDate: dates[0] ?? null,
    lastDate: dates[dates.length - 1] ?? null,
  };
}

/** 보관함 정렬 기준 날짜: 옮긴 시각 → 없으면 마지막 기록일 → 등록일 */
export function archivedSortKey(bean: Bean, s: BeanSummary) {
  return bean.archivedAt ?? (s.lastDate ? new Date(s.lastDate + "T12:00:00").getTime() : bean.createdAt);
}
