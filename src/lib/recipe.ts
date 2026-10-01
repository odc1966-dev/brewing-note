// 브루잉 레시피(뜸 들이기 → N차 푸어) 계산
import type { RecipeStep } from "./types";
import { uid } from "./util";

/** 붓는 방식(국내 바리스타가 흔히 쓰는 용어, 앱 설명은 일반적 의미) */
export const POUR_STYLES: { id: string; desc: string }[] = [
  { id: "센터푸어", desc: "가운데 한 곳에 붓기" },
  { id: "서클푸어", desc: "작은 원을 그리며 붓기" },
  { id: "스파이럴푸어", desc: "가운데서 바깥으로 나선을 그리며" },
  { id: "점드립", desc: "물방울 떨어뜨리듯 아주 가늘게" },
  { id: "연속푸어", desc: "끊지 않고 한 번에" },
  { id: "펄스푸어", desc: "여러 번 나눠 끊어서" },
];

export function newStep(steps: RecipeStep[], dose: number | null): RecipeStep {
  if (steps.length === 0) {
    // 뜸: 원두량의 2배가 흔한 출발점(레시피마다 다름)
    return { id: uid(), label: "뜸 들이기", at: 0, amount: dose ? dose * 2 : null, styles: ["센터푸어"], duration: null, memo: "" };
  }
  const last = steps[steps.length - 1];
  const n = steps.filter((s) => s.label !== "뜸 들이기").length + 1;
  return {
    id: uid(),
    label: `${n}차 푸어`,
    at: last.at !== null ? last.at + (steps.length === 1 ? 45 : 30) : null,
    amount: null,
    styles: last.styles.filter((x) => x !== "센터푸어").length ? last.styles : ["서클푸어"],
    duration: null,
    memo: "",
  };
}

/** 단계별 누적 물량 */
export function cumulative(steps: RecipeStep[]) {
  let sum = 0;
  return steps.map((s) => (sum += s.amount ?? 0));
}

export const recipeTotal = (steps: RecipeStep[]) => steps.reduce((a, s) => a + (s.amount ?? 0), 0);

/** 유속 g/초 */
export function flow(s: RecipeStep) {
  if (!s.amount || !s.duration) return null;
  return Math.round((s.amount / s.duration) * 10) / 10;
}

/** 공유 카드·목록용 한 줄 요약: "뜸 40 · 70 · 60 · 60 · 60g (5회)" */
export function recipeLine(steps: RecipeStep[]) {
  if (!steps.length) return "";
  const amounts = steps.map((s) => s.amount ?? "?");
  const bloom = steps[0].label === "뜸 들이기";
  const pours = bloom ? amounts.slice(1) : amounts;
  return `${bloom ? `뜸 ${amounts[0]} · ` : ""}${pours.join(" · ")}g (${steps.length}단계)`;
}

/** 레시피를 새 기록용으로 복사(id 새로) */
export const cloneSteps = (steps: RecipeStep[]) => steps.map((s) => ({ ...s, id: uid(), styles: [...s.styles] }));
