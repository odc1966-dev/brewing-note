// SCA·WCR Coffee Taster's Flavor Wheel(2016)의 용어 계층.
// 출처: Spencer M, Sage E, Velez M, Guinard JX. J Food Sci 2016;81(12):S2997–S3005, Table 4
//       (doi:10.1111/1750-3841.13555, PMID 27861864). 한국어 이름은 앱 자체 번역.
// 태그 id 는 경로를 ">" 로 이은 문자열: "Fruity", "Fruity>Berry", "Fruity>Berry>Blueberry"

export interface WheelNode {
  en: string;
  ko: string;
  children?: WheelNode[];
}

const n = (en: string, ko: string, children?: WheelNode[]): WheelNode => ({ en, ko, children });

export const WHEEL: (WheelNode & { color: string })[] = [
  {
    ...n("Floral", "꽃", [
      n("Black Tea", "홍차"),
      n("Floral", "꽃향", [n("Chamomile", "캐모마일"), n("Rose", "장미"), n("Jasmine", "재스민")]),
    ]),
    color: "#c9578f",
  },
  {
    ...n("Fruity", "과일", [
      n("Berry", "베리", [n("Blackberry", "블랙베리"), n("Raspberry", "라즈베리"), n("Blueberry", "블루베리"), n("Strawberry", "딸기")]),
      n("Dried Fruit", "말린 과일", [n("Raisin", "건포도"), n("Prune", "말린 자두")]),
      n("Other Fruit", "기타 과일", [
        n("Coconut", "코코넛"),
        n("Cherry", "체리"),
        n("Pomegranate", "석류"),
        n("Pineapple", "파인애플"),
        n("Grape", "포도"),
        n("Apple", "사과"),
        n("Peach", "복숭아"),
        n("Pear", "배"),
      ]),
      n("Citrus Fruit", "시트러스", [n("Grapefruit", "자몽"), n("Orange", "오렌지"), n("Lemon", "레몬"), n("Lime", "라임")]),
    ]),
    color: "#d64541",
  },
  {
    ...n("Sour/Fermented", "새콤·발효", [
      n("Sour", "신맛", [
        n("Sour Aromatics", "새콤한 향"),
        n("Acetic Acid", "아세트산(식초)"),
        n("Butyric Acid", "뷰티르산"),
        n("Isovaleric Acid", "아이소발레르산"),
        n("Citric Acid", "시트르산"),
        n("Malic Acid", "말산"),
      ]),
      n("Alcohol/Fermented", "알코올·발효", [n("Winey", "와인 같은"), n("Whiskey", "위스키"), n("Fermented", "발효"), n("Overripe", "너무 익은")]),
    ]),
    color: "#c9a227",
  },
  {
    ...n("Green/Vegetative", "풀·채소", [
      n("Olive Oil", "올리브유"),
      n("Raw", "날것"),
      n("Green/Vegetative", "풀·채소", [
        n("Under-ripe", "덜 익은"),
        n("Peapod", "완두콩 깍지"),
        n("Fresh", "신선한 풀"),
        n("Dark Green", "짙은 녹색 채소"),
        n("Vegetative", "채소"),
        n("Hay-like", "건초"),
        n("Herb-like", "허브"),
      ]),
      n("Beany", "콩 비린내"),
    ]),
    color: "#4f9a4a",
  },
  {
    ...n("Other", "기타", [
      n("Papery/Musty", "종이·퀴퀴함", [
        n("Stale", "묵은"),
        n("Cardboard", "판지"),
        n("Papery", "종이"),
        n("Woody", "나무"),
        n("Moldy/Damp", "곰팡이·축축함"),
        n("Musty/Dusty", "퀴퀴함·먼지"),
        n("Musty/Earthy", "퀴퀴함·흙"),
        n("Animalic", "동물성"),
        n("Meaty Brothy", "고기 육수"),
        n("Phenolic", "페놀"),
      ]),
      n("Chemical", "화학적", [
        n("Bitter", "쓴맛"),
        n("Salty", "짠맛"),
        n("Medicinal", "약품"),
        n("Petroleum", "석유"),
        n("Skunky", "스컹크 냄새"),
        n("Rubber", "고무"),
      ]),
    ]),
    color: "#5d8fa8",
  },
  {
    ...n("Roasted", "로스티", [
      n("Pipe Tobacco", "파이프 담배"),
      n("Tobacco", "담배"),
      n("Burnt", "탄 향", [n("Acrid", "매캐한"), n("Ashy", "재"), n("Smoky", "훈연"), n("Brown, Roast", "갈색 로스트")]),
      n("Cereal", "곡물", [n("Grain", "곡물"), n("Malt", "맥아")]),
    ]),
    color: "#8a5a3c",
  },
  {
    ...n("Spices", "향신료", [
      n("Pungent", "톡 쏘는"),
      n("Pepper", "후추"),
      n("Brown Spice", "갈색 향신료", [n("Anise", "아니스"), n("Nutmeg", "육두구"), n("Cinnamon", "계피"), n("Clove", "정향")]),
    ]),
    color: "#b0483a",
  },
  {
    ...n("Nutty/Cocoa", "견과·코코아", [
      n("Nutty", "견과", [n("Peanuts", "땅콩"), n("Hazelnut", "헤이즐넛"), n("Almond", "아몬드")]),
      n("Cocoa", "코코아", [n("Chocolate", "초콜릿"), n("Dark Chocolate", "다크 초콜릿")]),
    ]),
    color: "#7a5236",
  },
  {
    ...n("Sweet", "단맛", [
      n("Brown Sugar", "갈색 설탕", [n("Molasses", "당밀"), n("Maple Syrup", "메이플 시럽"), n("Caramelized", "캐러멜"), n("Honey", "꿀")]),
      n("Vanilla", "바닐라"),
      n("Vanillin", "바닐린"),
      n("Overall Sweet", "전반적인 단맛"),
      n("Sweet Aromatics", "달콤한 향"),
    ]),
    color: "#e08a3c",
  },
];

export const SEP = ">";

export interface WheelEntry {
  id: string;
  ko: string;
  en: string;
  depth: 1 | 2 | 3;
  color: string;
  path: string[]; // 한국어 경로
}

export const WHEEL_INDEX = new Map<string, WheelEntry>();
for (const top of WHEEL) {
  const add = (node: WheelNode, ids: string[], kos: string[]) => {
    const id = [...ids, node.en].join(SEP);
    const path = [...kos, node.ko];
    WHEEL_INDEX.set(id, { id, ko: node.ko, en: node.en, depth: path.length as 1 | 2 | 3, color: top.color, path });
    node.children?.forEach((c) => add(c, [...ids, node.en], path));
  };
  add(top, [], []);
}

export const resolveTag = (id: string) => WHEEL_INDEX.get(id);
