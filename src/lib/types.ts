// 모든 기록은 기기 안(IndexedDB)에 저장된다. id 는 crypto.randomUUID().

export type FlavorKey = "acidity" | "sweetness" | "bitterness" | "body" | "aroma";
export type Flavor = Record<FlavorKey, number>; // 0~5

export interface Bean {
  id: string;
  name: string; // 예: Ethiopia Yirgacheffe
  roaster: string;
  origin: string;
  process: string; // Washed / Natural ...
  roast: string; // Light ~ Dark
  roastDate: string; // YYYY-MM-DD, 비어 있을 수 있음
  cupNotes?: string[]; // 로스터리가 적은 컵노트(플레이버 휠 용어)
  notes: string; // 자유 메모
  archived: boolean; // 다 마신 원두(보관함)
  archivedAt?: number; // 보관함으로 옮긴 시각
  weight?: number | null; // 구입 용량 g (재고 계산용)
  stockAdjust?: number; // 남은 양을 직접 맞춘 보정값 g (+면 더 있음)
  createdAt: number;
}

export type GearKind = "grinder" | "dripper" | "kettle" | "scale" | "espresso" | "etc";

export interface Gear {
  id: string;
  kind: GearKind;
  name: string;
  memo: string;
  createdAt: number;
}

export interface Brew {
  id: string;
  date: string; // YYYY-MM-DD
  beanId: string;
  method: string;
  gearIds: string[];
  dose: number | null; // 원두 g
  water: number | null; // 물 g (에스프레소는 추출량)
  temp: number | null; // °C
  grind: string; // "16클릭" 처럼 자유 입력
  time: number | null; // 초
  waterType: string;
  flavor: Flavor;
  tags: string[];
  rating: number; // 0~5, 0.5 단위
  memo: string;
  photos?: string[]; // photos 저장소의 id
  pours?: number[]; // 타이머에서 기록한 푸어 시각(초) — 레시피 없이 쓴 경우
  recipe?: RecipeStep[]; // 브루잉 레시피(뜸·N차 푸어)
  recipeActual?: (number | null)[]; // 타이머로 기록한 단계별 실제 시작 시각(초), recipe 와 같은 순서
  createdAt: number;
  updatedAt: number;
}

export interface CafeLog {
  id: string;
  date: string;
  cafe: string;
  menu: string;
  beanInfo: string; // 원두 정보(선택)
  price: number | null;
  flavor: Flavor;
  tags: string[];
  rating: number;
  memo: string;
  photos?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  nickname: string;
  defaultMethod: string;
  defaultTemp: number;
  timerSteps?: TimerStep[];
  recipes?: SavedRecipe[]; // 내 레시피
}

/** 브루잉 레시피의 한 단계. amount 는 이번에 붓는 양(회차별), 누적은 계산 */
export interface RecipeStep {
  id: string;
  label: string; // 뜸 들이기 / 1차 푸어 …
  at: number | null; // 시작 시각(초)
  amount: number | null; // 이번 물량 g
  styles: string[]; // 붓는 방식(센터푸어 등)
  duration: number | null; // 붓는 시간(초) → 유속 계산
  memo: string;
}

export interface SavedRecipe {
  id: string;
  name: string;
  method: string;
  dose: number | null;
  water: number | null;
  temp: number | null;
  grind: string;
  steps: RecipeStep[];
  createdAt: number;
}

/** 타이머 안내 단계: at 초에 시작, 물을 누적 pct% 까지 (0 이면 물 안내 없음) */
export interface TimerStep {
  at: number;
  label: string;
  pct: number;
}

export interface DataShape {
  beans: Bean[];
  gear: Gear[];
  brews: Brew[];
  cafes: CafeLog[];
  settings: Settings;
}
