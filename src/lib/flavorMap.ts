// "내 플레이버 휠" — 기록을 모으고 고른 노트로 거르는 계산. 휠 그림의 기하는 sunburst.ts.

import { SEP } from "./flavorWheel";
import type { Brew, CafeLog } from "./types";

/** 태그가 고른 노트(대분류·중분류·세부 어느 단계든)에 들어가는지 */
export const tagUnder = (tag: string, pick: string) => tag === pick || tag.startsWith(pick + SEP);

export type Rec = { kind: "brew"; date: string; createdAt: number; tags: string[]; brew: Brew } | { kind: "cafe"; date: string; createdAt: number; tags: string[]; cafe: CafeLog };

export function toRecs(brews: Brew[], cafes: CafeLog[]): Rec[] {
  const out: Rec[] = [
    ...brews.map((b) => ({ kind: "brew" as const, date: b.date, createdAt: b.createdAt, tags: b.tags ?? [], brew: b })),
    ...cafes.map((c) => ({ kind: "cafe" as const, date: c.date, createdAt: c.createdAt, tags: c.tags ?? [], cafe: c })),
  ];
  return out.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}

/** 고른 노트로 거르기. all=true 면 모두 가진 기록, 아니면 하나라도 가진 기록 */
export function filterRecs(recs: Rec[], picks: string[], all: boolean) {
  if (!picks.length) return recs;
  const has = (r: Rec, p: string) => r.tags.some((t) => tagUnder(t, p));
  return recs.filter((r) => (all ? picks.every((p) => has(r, p)) : picks.some((p) => has(r, p))));
}
