// "내 플레이버 휠" — 기록에 붙인 컵노트를 갈래(대분류)별로 모아 세는 계산.
// 용어 계층은 flavorWheel.ts(SCA·WCR 2016 용어 + 앱 추가 표현)를 쓰지만,
// 그림은 공식 휠을 옮기지 않는다: 색은 앱 자체 팔레트, 모양은 동심원 3단 휠이 아닌 꽃잎(로즈) 차트.

import { IMPRESSION, SEP, WHEEL, resolveTag } from "./flavorWheel";
import type { Brew, CafeLog } from "./types";

/** 앱 자체 색 (공식 휠 색과 다르게 정함) */
const PALETTE: Record<string, string> = {
  Floral: "#8e6cc4",
  Fruity: "#e2607a",
  "Sour/Fermented": "#2a9d8f",
  "Green/Vegetative": "#7aa63a",
  Other: "#7d8797",
  Roasted: "#5b4336",
  Spices: "#c46a2f",
  "Nutty/Cocoa": "#a07650",
  Sweet: "#d9a520",
  Impression: "#4a78b8",
};

export interface Petal {
  id: string; // 대분류 id ("Fruity")
  ko: string;
  color: string;
}

export const PETALS: Petal[] = [...WHEEL, IMPRESSION].map((t) => ({ id: t.en, ko: t.ko, color: PALETTE[t.en] ?? "#7d8797" }));
export const petalOf = (id: string) => PETALS.find((p) => p.id === id);

/** 태그가 속한 대분류 id (모르는 태그면 null) */
export const topOf = (tag: string) => (resolveTag(tag) ? tag.split(SEP)[0] : null);

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

/** 대분류마다 그 노트가 하나라도 있는 기록 수 */
export function countPetals(recs: Rec[]) {
  const m = new Map<string, number>();
  for (const r of recs) {
    const tops = new Set(r.tags.map(topOf).filter((x): x is string => !!x));
    tops.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1));
  }
  return m;
}

/** 한 대분류 안에서 노트별 기록 수 (중분류는 아래 세부 노트까지 포함해 셈) */
export function countNotes(recs: Rec[], top: string) {
  const m = new Map<string, number>();
  for (const r of recs) {
    const ids = new Set<string>();
    for (const t of r.tags) {
      if (!resolveTag(t) || t.split(SEP)[0] !== top) continue;
      const parts = t.split(SEP);
      for (let i = 2; i <= parts.length; i++) ids.add(parts.slice(0, i).join(SEP));
    }
    ids.forEach((id) => m.set(id, (m.get(id) ?? 0) + 1));
  }
  return m;
}

/** 기록 하나의 작은 휠: 대분류별 노트 개수 */
export function petalTally(tags: string[]) {
  const m = new Map<string, number>();
  for (const t of tags) {
    const top = topOf(t);
    if (top) m.set(top, (m.get(top) ?? 0) + 1);
  }
  return m;
}
