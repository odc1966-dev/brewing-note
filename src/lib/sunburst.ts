// 실제형 플레이버 휠(3단 선버스트) 기하.
// 칸 = SCA·WCR 2016 용어(flavorWheel.ts 의 s()·d() 노드)만, 원래 휠과 같은 순서. 칸 폭 = 세부 노트 수.
// 앱 추가 표현 x() 는 칸이 없고, 가장 가까운 SCA 조상 칸에 포함해 센다. 결점 d() 는 회색·선택 불가.
// 색은 갈래 기본색(flavorWheel.ts color) 안에서 칸마다 명도·색조를 조금씩 바꾼 앱 자체 색.

import { SEP, WHEEL, type WheelNode } from "./flavorWheel";

export const R0 = 28;
export const R1 = 98;
export const R2 = 158;
export const R3 = 240;

export interface Seg {
  id: string; // 태그 id ("Fruity>Berry>Blueberry")
  ko: string;
  ring: 1 | 2 | 3; // 1=갈래, 2=중분류, 3=세부(세부가 없는 중분류는 2~3을 함께 차지)
  a0: number;
  a1: number;
  ri: number;
  ro: number;
  fill: string;
  text: string; // 칸 위 글자색
  def: boolean;
  outer: boolean; // 바깥 고리에 닿는 칸(막대를 붙이는 칸)
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255,
    g = parseInt(hex.slice(3, 5), 16) / 255,
    b = parseInt(hex.slice(5, 7), 16) / 255;
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

/** 칸 색과 그 위에 쓸 글자색(대비가 더 큰 쪽) */
function tone(h: number, s: number, l: number) {
  h = ((h % 360) + 360) % 360;
  l = Math.max(20, Math.min(88, l));
  const lum = hslToRgb(h, s, l)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((acc, c, i) => acc + c * [0.2126, 0.7152, 0.0722][i], 0);
  const vsWhite = 1.05 / (lum + 0.05);
  const vsInk = (lum + 0.05) / 0.0644; // 잉크 #2B1D15 의 상대 휘도 ≈ 0.0144
  return { fill: `hsl(${h.toFixed(0)} ${s.toFixed(0)}% ${l.toFixed(0)}%)`, text: vsWhite >= vsInk ? "#FFFFFF" : "#2B1D15" };
}

const sca = (n: WheelNode) => !n.extra;

export const GEO = (() => {
  let total = 0;
  for (const c of WHEEL) for (const s of (c.children ?? []).filter(sca)) total += Math.max(1, (s.children ?? []).filter(sca).length);
  const A = (Math.PI * 2) / total;
  const segs: Seg[] = [];
  let slot = 0;
  for (const c of WHEEL) {
    const [H, S0, L0] = hexToHsl(c.color);
    const subs = (c.children ?? []).filter(sca);
    const catDef = subs.length > 0 && subs.every((s) => s.defect);
    const S = catDef ? 6 : S0;
    const L = catDef ? 58 : L0;
    const cs = slot;
    subs.forEach((sb, si) => {
      const sid = [c.en, sb.en].join(SEP);
      const leaves = (sb.children ?? []).filter(sca);
      const def = !!sb.defect;
      const sub = tone(H + (si - (subs.length - 1) / 2) * 7, def ? 6 : S, (def ? 58 : L) + 9 + (si % 2) * 5);
      if (!leaves.length) {
        segs.push({ id: sid, ko: sb.ko, ring: 2, a0: slot * A, a1: (slot + 1) * A, ri: R1, ro: R3, ...sub, def, outer: true });
        slot++;
        return;
      }
      const s0 = slot;
      leaves.forEach((lf, li) => {
        const t = tone(H + (li - (leaves.length - 1) / 2) * 6, (def ? 6 : S) * 0.92, (def ? 58 : L) + 22 + (li % 3) * 5);
        segs.push({ id: [sid, lf.en].join(SEP), ko: lf.ko, ring: 3, a0: slot * A, a1: (slot + 1) * A, ri: R2, ro: R3, ...t, def: def || !!lf.defect, outer: true });
        slot++;
      });
      segs.push({ id: sid, ko: sb.ko, ring: 2, a0: s0 * A, a1: slot * A, ri: R1, ro: R2, ...sub, def, outer: false });
    });
    segs.push({ id: c.en, ko: c.ko, ring: 1, a0: cs * A, a1: slot * A, ri: R0, ro: R1, ...tone(H, S, L - 4), def: catDef, outer: false });
  }
  const byId = new Map(segs.map((s) => [s.id, s]));
  return { segs, byId };
})();

const P = (a: number, r: number) => `${(Math.sin(a) * r).toFixed(1)} ${(-Math.cos(a) * r).toFixed(1)}`;

/** 12시 방향에서 시계 방향 각도 a0→a1, 반지름 ri→ro 의 고리 조각 */
export function arcPath(a0: number, a1: number, ri: number, ro: number) {
  const L = a1 - a0 > Math.PI ? 1 : 0;
  return `M${P(a0, ro)}A${ro} ${ro} 0 ${L} 1 ${P(a1, ro)}L${P(a1, ri)}A${ri} ${ri} 0 ${L} 0 ${P(a0, ri)}Z`;
}

/** 태그가 그려질 칸: 자기 칸, 없으면(앱 추가 표현) 가장 가까운 SCA 조상 칸 */
export function segOf(tag: string): Seg | undefined {
  const parts = tag.split(SEP);
  for (let i = parts.length; i > 0; i--) {
    const s = GEO.byId.get(parts.slice(0, i).join(SEP));
    if (s) return s;
  }
  return undefined;
}

/** 칸 가운데에 글자를 바깥쪽으로 읽히게 놓는 SVG transform 과 정렬 */
export function labelAt(s: Seg, r: number) {
  const a = (s.a0 + s.a1) / 2;
  const deg = (a * 180) / Math.PI;
  const left = deg > 180;
  return {
    transform: left ? `rotate(${(deg + 90).toFixed(1)}) translate(${-r},0)` : `rotate(${(deg - 90).toFixed(1)}) translate(${r},0)`,
    anchor: (left ? "end" : "start") as "end" | "start",
  };
}
