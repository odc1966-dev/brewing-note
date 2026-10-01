// 컵노트 용어 계층.
// 뼈대 = SCA·WCR Coffee Taster's Flavor Wheel(2016): Spencer M, Sage E, Velez M, Guinard JX.
//        J Food Sci 2016;81(12):S2997–S3005, Table 4 (doi:10.1111/1750-3841.13555, PMID 27861864)
// x(…) = SCA 휠에 없는 추가 용어(로스터리 컵노트에 흔한 관용 표현·한국식 노트). 표준 정의·기준 물질은 없다.
// d(…) = 결점 성격의 SCA 용어. 고르는 목록에서는 숨기고, 예전 기록의 이름 표시용으로만 남긴다.
// 한국어 이름은 앱 자체 번역. 태그 id 는 영어 경로를 ">" 로 이은 문자열("Fruity>Berry>Blueberry").

export interface WheelNode {
  en: string;
  ko: string;
  children?: WheelNode[];
  extra?: boolean; // SCA 휠 밖의 추가 용어
  defect?: boolean; // 숨김(결점)
}

const s = (en: string, ko: string, children?: WheelNode[]): WheelNode => ({ en, ko, children });
const x = (en: string, ko: string, children?: WheelNode[]): WheelNode => ({ en, ko, children, extra: true });
const d = (en: string, ko: string, children?: WheelNode[]): WheelNode => ({ en, ko, children, defect: true });

export const WHEEL: (WheelNode & { color: string })[] = [
  {
    ...s("Floral", "꽃", [
      s("Black Tea", "홍차"),
      s("Floral", "꽃향", [
        s("Chamomile", "캐모마일"),
        s("Rose", "장미"),
        s("Jasmine", "재스민"),
        x("Lavender", "라벤더"),
        x("Hibiscus", "히비스커스"),
        x("Orange Blossom", "오렌지 꽃"),
        x("Elderflower", "엘더플라워"),
        x("Honeysuckle", "인동꽃"),
        x("Lilac", "라일락"),
        x("Violet", "제비꽃"),
        x("Coffee Blossom", "커피 꽃"),
        x("Acacia", "아카시아"),
        x("Magnolia", "목련"),
        x("Cherry Blossom", "벚꽃"),
        x("Plum Blossom", "매화"),
        x("Lotus", "연꽃"),
        x("Freesia", "프리지아"),
      ]),
      x("Tea", "차", [
        x("Earl Grey", "얼그레이"),
        x("Green Tea", "녹차"),
        x("Matcha", "말차"),
        x("Oolong", "우롱차"),
        x("White Tea", "백차"),
        x("Pu-erh", "보이차"),
        x("Hojicha", "호지차"),
        x("Jasmine Tea", "재스민차"),
        x("Rooibos", "루이보스"),
        x("Chrysanthemum Tea", "국화차"),
        x("Barley Tea", "보리차"),
        x("Solomon's Seal Tea", "둥굴레차"),
      ]),
    ]),
    color: "#c9578f",
  },
  {
    ...s("Fruity", "과일", [
      s("Berry", "베리", [
        s("Blackberry", "블랙베리"),
        s("Raspberry", "라즈베리"),
        s("Blueberry", "블루베리"),
        s("Strawberry", "딸기"),
        x("Cranberry", "크랜베리"),
        x("Blackcurrant", "블랙커런트(카시스)"),
        x("Redcurrant", "레드커런트"),
        x("Gooseberry", "구스베리"),
        x("Mulberry", "오디"),
        x("Bokbunja", "복분자"),
        x("Omija", "오미자"),
        x("Aronia", "아로니아"),
        x("Berry Jam", "베리 잼"),
      ]),
      s("Dried Fruit", "말린 과일", [
        s("Raisin", "건포도"),
        s("Prune", "말린 자두"),
        x("Fig", "무화과"),
        x("Date", "대추야자"),
        x("Dried Apricot", "말린 살구"),
        x("Dried Mango", "말린 망고"),
        x("Gotgam", "곶감"),
        x("Jujube", "대추"),
      ]),
      s("Other Fruit", "기타 과일", [
        s("Coconut", "코코넛"),
        s("Cherry", "체리"),
        s("Pomegranate", "석류"),
        s("Pineapple", "파인애플"),
        s("Grape", "포도"),
        s("Apple", "사과"),
        s("Peach", "복숭아"),
        s("Pear", "배"),
        x("Persimmon", "단감"),
        x("Hongsi", "홍시"),
      ]),
      x("Stone Fruit", "핵과", [
        x("Apricot", "살구"),
        x("Plum", "자두"),
        x("Nectarine", "천도복숭아"),
        x("White Peach", "백도"),
        x("Yellow Peach", "황도"),
        x("Black Cherry", "블랙체리"),
        x("Maesil", "매실"),
      ]),
      x("Tropical Fruit", "열대과일", [
        x("Mango", "망고"),
        x("Passion Fruit", "패션프루트"),
        x("Lychee", "리치"),
        x("Guava", "구아바"),
        x("Papaya", "파파야"),
        x("Banana", "바나나"),
        x("Kiwi", "키위"),
        x("Dragon Fruit", "용과"),
        x("Mangosteen", "망고스틴"),
        x("Rambutan", "람부탄"),
        x("Jackfruit", "잭프루트"),
        x("Starfruit", "스타프루트"),
      ]),
      x("Apple & Pear", "사과·배류", [
        x("Green Apple", "청사과"),
        x("Red Apple", "빨간 사과"),
        x("Baked Apple", "구운 사과"),
        x("Quince", "모과"),
      ]),
      x("Grape & Melon", "포도·멜론", [
        x("Green Grape", "청포도"),
        x("Red Grape", "적포도"),
        x("Muscat", "머스캣"),
        x("Shine Muscat", "샤인머스캣"),
        x("Kyoho", "거봉"),
        x("Melon", "멜론"),
        x("Cantaloupe", "캔털루프"),
        x("Honeydew", "허니듀 멜론"),
        x("Watermelon", "수박"),
        x("Chamoe", "참외"),
      ]),
      s("Citrus Fruit", "시트러스", [
        s("Grapefruit", "자몽"),
        s("Orange", "오렌지"),
        s("Lemon", "레몬"),
        s("Lime", "라임"),
        x("Tangerine", "귤"),
        x("Blood Orange", "블러드 오렌지"),
        x("Bergamot", "베르가못"),
        x("Kumquat", "금귤"),
        x("Pomelo", "포멜로"),
        x("Yuja", "유자"),
        x("Hallabong", "한라봉"),
        x("Cheonhyehyang", "천혜향"),
        x("Citrus Peel", "시트러스 껍질"),
        x("Marmalade", "마멀레이드"),
        x("Lemon Curd", "레몬 커드"),
      ]),
    ]),
    color: "#d64541",
  },
  {
    ...s("Sour/Fermented", "새콤·발효", [
      s("Sour", "신맛", [
        s("Sour Aromatics", "새콤한 향"),
        d("Acetic Acid", "아세트산(식초)"),
        d("Butyric Acid", "뷰티르산"),
        d("Isovaleric Acid", "아이소발레르산"),
        s("Citric Acid", "시트르산"),
        s("Malic Acid", "말산"),
        x("Tartaric", "타르타르(포도 같은 신맛)"),
        x("Tamarind", "타마린드"),
      ]),
      s("Alcohol/Fermented", "알코올·발효", [
        s("Winey", "와인 같은"),
        s("Whiskey", "위스키"),
        s("Fermented", "발효"),
        s("Overripe", "너무 익은"),
        x("Red Wine", "레드와인"),
        x("White Wine", "화이트와인"),
        x("Sparkling Wine", "스파클링와인"),
        x("Sherry", "셰리"),
        x("Port", "포트와인"),
        x("Rum", "럼"),
        x("Brandy", "브랜디"),
        x("Liqueur", "리큐르"),
        x("Cider", "사과주(사이더)"),
        x("Sake", "사케"),
        x("Makgeolli", "막걸리"),
        x("Kombucha", "콤부차"),
      ]),
    ]),
    color: "#c9a227",
  },
  {
    ...s("Green/Vegetative", "풀·채소", [
      s("Olive Oil", "올리브유"),
      d("Raw", "날것"),
      s("Green/Vegetative", "풀·채소", [
        d("Under-ripe", "덜 익은"),
        s("Peapod", "완두콩 깍지"),
        s("Fresh", "신선한 풀"),
        s("Dark Green", "짙은 녹색 채소"),
        s("Vegetative", "채소"),
        s("Hay-like", "건초"),
        s("Herb-like", "허브"),
      ]),
      d("Beany", "콩 비린내"),
      x("Herb", "허브류", [
        x("Mint", "민트"),
        x("Basil", "바질"),
        x("Lemongrass", "레몬그라스"),
        x("Thyme", "타임"),
        x("Rosemary", "로즈마리"),
        x("Sage", "세이지"),
        x("Eucalyptus", "유칼립투스"),
        x("Cilantro", "고수"),
        x("Mugwort", "쑥"),
        x("Perilla Leaf", "깻잎"),
      ]),
      x("Vegetable", "채소류", [x("Tomato", "토마토"), x("Bell Pepper", "피망"), x("Cucumber", "오이"), x("Celery", "셀러리")]),
    ]),
    color: "#4f9a4a",
  },
  {
    ...s("Other", "기타", [
      d("Papery/Musty", "종이·퀴퀴함", [
        d("Stale", "묵은"),
        d("Cardboard", "판지"),
        d("Papery", "종이"),
        d("Woody", "나무"),
        d("Moldy/Damp", "곰팡이·축축함"),
        d("Musty/Dusty", "퀴퀴함·먼지"),
        d("Musty/Earthy", "퀴퀴함·흙"),
        d("Animalic", "동물성"),
        d("Meaty Brothy", "고기 육수"),
        d("Phenolic", "페놀"),
      ]),
      d("Chemical", "화학적", [
        d("Bitter", "쓴맛"),
        d("Salty", "짠맛"),
        d("Medicinal", "약품"),
        d("Petroleum", "석유"),
        d("Skunky", "스컹크 냄새"),
        d("Rubber", "고무"),
      ]),
      x("Wood", "나무 향", [x("Cedar", "삼나무"), x("Oak", "오크"), x("Sandalwood", "백단"), x("Pine", "소나무"), x("Cigar Box", "시가 상자")]),
      x("Dairy", "유제품", [x("Butter", "버터"), x("Cream", "크림"), x("Milk", "우유"), x("Yogurt", "요거트"), x("Condensed Milk", "연유")]),
    ]),
    color: "#5d8fa8",
  },
  {
    ...s("Roasted", "로스티", [
      s("Pipe Tobacco", "파이프 담배"),
      s("Tobacco", "담배"),
      s("Burnt", "탄 향", [
        d("Acrid", "매캐한"),
        d("Ashy", "재"),
        s("Smoky", "훈연"),
        s("Brown, Roast", "갈색 로스트"),
        x("Roasted Coffee", "볶은 커피"),
        x("Liquorice", "감초"),
      ]),
      s("Cereal", "곡물류", [
        s("Grain", "곡물"),
        s("Malt", "맥아"),
        x("Toast", "토스트"),
        x("Bread Crust", "빵 껍질"),
        x("Biscuit", "비스킷"),
        x("Granola", "그래놀라"),
        x("Barley", "보리"),
        x("Brown Rice", "현미"),
        x("Nurungji", "누룽지"),
        x("Roasted Sweet Potato", "군고구마"),
      ]),
    ]),
    color: "#8a5a3c",
  },
  {
    ...s("Spices", "향신료", [
      s("Pungent", "톡 쏘는"),
      s("Pepper", "후추"),
      s("Brown Spice", "갈색 향신료", [
        s("Anise", "아니스"),
        s("Nutmeg", "육두구"),
        s("Cinnamon", "계피"),
        s("Clove", "정향"),
        x("Cardamom", "카다멈"),
        x("Allspice", "올스파이스"),
        x("Star Anise", "팔각"),
        x("Ginger", "생강"),
      ]),
      x("Peppercorn", "후추류", [
        x("Black Pepper", "흑후추"),
        x("White Pepper", "백후추"),
        x("Pink Peppercorn", "핑크페퍼"),
        x("Coriander Seed", "고수 씨"),
      ]),
    ]),
    color: "#b0483a",
  },
  {
    ...s("Nutty/Cocoa", "견과·코코아", [
      s("Nutty", "견과", [
        s("Peanuts", "땅콩"),
        s("Hazelnut", "헤이즐넛"),
        s("Almond", "아몬드"),
        x("Walnut", "호두"),
        x("Pecan", "피칸"),
        x("Cashew", "캐슈넛"),
        x("Macadamia", "마카다미아"),
        x("Pistachio", "피스타치오"),
        x("Chestnut", "밤"),
        x("Pine Nut", "잣"),
        x("Sesame", "참깨"),
        x("Black Sesame", "흑임자"),
      ]),
      s("Cocoa", "코코아", [
        s("Chocolate", "초콜릿"),
        s("Dark Chocolate", "다크 초콜릿"),
        x("Milk Chocolate", "밀크 초콜릿"),
        x("White Chocolate", "화이트 초콜릿"),
        x("Cacao Nib", "카카오닙"),
        x("Cocoa Powder", "코코아 파우더"),
        x("Brownie", "브라우니"),
      ]),
      x("Nut Confection", "견과 디저트", [x("Praline", "프랄린"), x("Nougat", "누가"), x("Marzipan", "마지팬"), x("Peanut Butter", "땅콩버터")]),
    ]),
    color: "#7a5236",
  },
  {
    ...s("Sweet", "단맛", [
      s("Brown Sugar", "갈색 설탕", [
        s("Molasses", "당밀"),
        s("Maple Syrup", "메이플 시럽"),
        s("Caramelized", "캐러멜"),
        s("Honey", "꿀"),
        x("Panela", "비정제 설탕(파넬라)"),
        x("Sugar Cane", "사탕수수"),
        x("Butterscotch", "버터스카치"),
        x("Toffee", "토피"),
        x("Jocheong", "조청"),
        x("Dalgona", "달고나"),
        x("Acacia Honey", "아카시아꿀"),
      ]),
      s("Vanilla", "바닐라"),
      s("Vanillin", "바닐린"),
      s("Overall Sweet", "전반적인 단맛"),
      s("Sweet Aromatics", "달콤한 향"),
      x("Dessert", "디저트", [
        x("Creme Brulee", "크렘 브륄레"),
        x("Custard", "커스터드"),
        x("Marshmallow", "마시멜로"),
        x("Cotton Candy", "솜사탕"),
        x("Cookie", "쿠키"),
        x("Pound Cake", "파운드케이크"),
        x("Fruit Jam", "과일 잼"),
        x("Candy", "사탕"),
        x("Red Bean", "팥"),
        x("Injeolmi", "인절미"),
        x("Yakgwa", "약과"),
      ]),
    ]),
    color: "#e08a3c",
  },
];

/** 맛 종류와 따로 고르는 질감·산미 성격·여운·인상 (모두 앱 추가 표현) */
export const IMPRESSION: WheelNode & { color: string } = {
  ...x("Impression", "질감·인상", [
    x("Mouthfeel", "마우스필(질감)", [
      x("Silky", "실키한"),
      x("Creamy", "크리미한"),
      x("Velvety", "벨벳 같은"),
      x("Juicy", "주시한"),
      x("Syrupy", "시럽 같은"),
      x("Round", "둥근"),
      x("Tea-like", "차처럼 가벼운"),
      x("Light Body", "가벼운 바디"),
      x("Heavy Body", "묵직한 바디"),
      x("Smooth", "부드러운"),
      x("Dry Mouthfeel", "떫은·건조한"),
    ]),
    x("Acidity", "산미 성격", [
      x("Bright", "밝은"),
      x("Crisp", "쨍한"),
      x("Mellow", "은은한"),
      x("Lively", "생동감 있는"),
      x("Winey Acidity", "와인 같은 산미"),
      x("Citric-like", "귤 같은 산미"),
      x("Malic-like", "사과 같은 산미"),
      x("Tart", "시큼한"),
      x("Low Acidity", "산미 약함"),
    ]),
    x("Finish", "여운", [
      x("Long Finish", "긴 여운"),
      x("Short Finish", "짧은 여운"),
      x("Sweet Finish", "단 여운"),
      x("Clean Finish", "깔끔한 여운"),
      x("Lingering", "오래 남는"),
      x("Dry Finish", "드라이한 여운"),
    ]),
    x("Overall", "전체 인상", [
      x("Balanced", "균형 잡힌"),
      x("Complex", "복합적인"),
      x("Clean", "깨끗한"),
      x("Clarity", "선명한"),
      x("Refreshing", "산뜻한"),
      x("Sweet Overall", "달콤한 인상"),
      x("Bold", "진한"),
      x("Delicate", "섬세한"),
    ]),
  ]),
  color: "#64748b",
};

export const SEP = ">";

export interface WheelEntry {
  id: string;
  ko: string;
  en: string;
  depth: 1 | 2 | 3;
  color: string;
  path: string[]; // 한국어 경로
  extra: boolean;
  defect: boolean;
}

export const WHEEL_INDEX = new Map<string, WheelEntry>();
for (const top of [...WHEEL, IMPRESSION]) {
  const add = (node: WheelNode, ids: string[], kos: string[], defect: boolean) => {
    const id = [...ids, node.en].join(SEP);
    const path = [...kos, node.ko];
    const isDefect = defect || !!node.defect;
    WHEEL_INDEX.set(id, { id, ko: node.ko, en: node.en, depth: path.length as 1 | 2 | 3, color: top.color, path, extra: !!node.extra, defect: isDefect });
    node.children?.forEach((c) => add(c, [...ids, node.en], path, isDefect));
  };
  add(top, [], [], false);
}

export const resolveTag = (id: string) => WHEEL_INDEX.get(id);

/** 고를 수 있는(결점 아닌) 용어 수 — 대분류 제외 */
export const pickableCount = () => [...WHEEL_INDEX.values()].filter((e) => !e.defect && e.depth > 1).length;

/** 검색: 한국어·영어 부분 일치. 결점 제외 */
export function searchTags(q: string, limit = 40) {
  const t = q.trim().toLowerCase().replace(/\s+/g, "");
  if (!t) return [];
  const out: WheelEntry[] = [];
  for (const e of WHEEL_INDEX.values()) {
    if (e.defect || e.depth === 1) continue;
    const hay = (e.ko + e.en).toLowerCase().replace(/\s+/g, "");
    if (hay.includes(t)) out.push(e);
  }
  // 이름이 검색어로 시작하는 것, 구체적인 것(3단계) 먼저
  out.sort((a, b) => Number(!a.ko.startsWith(q.trim())) - Number(!b.ko.startsWith(q.trim())) || b.depth - a.depth);
  return out.slice(0, limit);
}
