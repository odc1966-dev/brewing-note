import type { Flavor, FlavorKey, GearKind } from "./types";
import { resolveTag } from "./flavorWheel";

export const FLAVOR_AXES: { key: FlavorKey; label: string; en: string }[] = [
  { key: "acidity", label: "산미", en: "Acidity" },
  { key: "sweetness", label: "단맛", en: "Sweetness" },
  { key: "bitterness", label: "쓴맛", en: "Bitterness" },
  { key: "body", label: "바디", en: "Body" },
  { key: "aroma", label: "향미", en: "Aroma" },
];

export const EMPTY_FLAVOR: Flavor = { acidity: 0, sweetness: 0, bitterness: 0, body: 0, aroma: 0 };

// 컵노트(플레이버 태그)는 SCA·WCR 플레이버 휠의 용어를 쓴다 → flavorWheel.ts
// 휠에 없는 id(직접 입력한 노트)는 그대로 글자로 보여 준다.

export const METHODS = ["핸드드립", "에스프레소", "AeroPress", "프렌치프레스", "모카포트", "콜드브루", "사이폰", "기타"];
export const ROASTS = ["Light", "Medium-Light", "Medium", "Medium-Dark", "Dark"];
export const PROCESSES = ["Washed", "Natural", "Honey", "Anaerobic", "기타"];

export const GEAR_KINDS: { id: GearKind; label: string }[] = [
  { id: "grinder", label: "그라인더" },
  { id: "dripper", label: "드리퍼" },
  { id: "kettle", label: "주전자" },
  { id: "scale", label: "저울" },
  { id: "espresso", label: "머신" },
  { id: "etc", label: "기타" },
];

export const gearKindLabel = (k: GearKind) => GEAR_KINDS.find((g) => g.id === k)?.label ?? "기타";
export const tagLabel = (id: string) => resolveTag(id)?.ko ?? id;
export const tagColor = (id: string) => resolveTag(id)?.color ?? "#7c8a99";
