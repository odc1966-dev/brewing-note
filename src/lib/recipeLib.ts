// 레시피 탭: 참고(내장)·내가 추가한 남의 레시피·내 레시피를 한 모양(RefRecipe)으로 다룬다.
// id 규칙: "ref:<id>" 내장 참고 레시피 / "c:<id>" 내가 추가한 남의 레시피 / "my:<id>" 내 레시피
import { REF_RECIPES, type RefRecipe } from "./refRecipes";
import { cloneSteps } from "./recipe";
import type { SavedRecipe, Settings } from "./types";
import { uid } from "./util";

export type RecipeKind = "ref" | "c" | "my";

export interface RecipeEntry {
  key: string; // ref:… / c:… / my:…
  kind: RecipeKind;
  r: RefRecipe;
  saved?: SavedRecipe; // 내 레시피일 때 원본
}

/** 내 레시피를 화면용 모양으로 */
export function savedAsRef(s: SavedRecipe, nickname: string): RefRecipe {
  return {
    id: s.id,
    name: s.name,
    author: s.fromName ? `${nickname || "나"} · ${s.fromName}에서 복사` : nickname || "나",
    group: "custom",
    serve: s.serve ?? "HOT",
    brewer: s.method || "핸드드립",
    dose: s.dose,
    water: s.water,
    ice: s.ice ?? null,
    temp: s.temp,
    grind: { desc: s.grind || undefined },
    intent: s.memo ?? "",
    steps: s.steps,
    sources: [],
    createdAt: s.createdAt,
  };
}

export function allEntries(settings: Settings): RecipeEntry[] {
  return [
    ...REF_RECIPES.map((r) => ({ key: "ref:" + r.id, kind: "ref" as const, r })),
    ...(settings.customRefs ?? []).map((r) => ({ key: "c:" + r.id, kind: "c" as const, r })),
    ...(settings.recipes ?? []).map((s) => ({ key: "my:" + s.id, kind: "my" as const, r: savedAsRef(s, settings.nickname), saved: s })),
  ];
}

export function findEntry(settings: Settings, key: string | null): RecipeEntry | undefined {
  if (!key) return undefined;
  return allEntries(settings).find((e) => e.key === key);
}

/** 그라인더·설정·설명을 기록의 '분쇄도' 칸 한 줄로 */
export function grindText(r: RefRecipe) {
  return [[r.grind.grinder, r.grind.setting].filter(Boolean).join(" "), r.grind.desc].filter(Boolean).join(" · ");
}

/** 참고 레시피 → 내 레시피로 복사(고쳐 쓰기용) */
export function toSaved(e: RecipeEntry): SavedRecipe {
  const r = e.r;
  return {
    id: uid(),
    name: e.kind === "my" ? `${r.name} (복사)` : r.name,
    method: "핸드드립",
    dose: r.dose,
    water: r.water,
    temp: r.temp,
    grind: grindText(r),
    steps: cloneSteps(r.steps),
    createdAt: Date.now(),
    serve: r.serve,
    ice: r.ice ?? null,
    memo: e.kind === "my" ? e.saved?.memo ?? "" : "",
    fromRef: e.kind === "my" ? e.saved?.fromRef : e.key,
    fromName: e.kind === "my" ? e.saved?.fromName : `${r.author} ${r.name}`,
  };
}

export const kindLabel = (k: RecipeKind) => (k === "my" ? "내 레시피" : k === "c" ? "내가 추가" : "참고");
