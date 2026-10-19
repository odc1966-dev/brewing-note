"use client";

import { PETALS, petalTally } from "@/lib/flavorMap";

const N = PETALS.length;
const STEP = (Math.PI * 2) / N;

/** 꽃잎 하나: 안쪽 반지름 r0 에서 바깥 r 까지, 끝이 둥근 부채꼴. i 번째 자리(12시부터 시계 방향) */
function petalPath(i: number, r0: number, r: number, pad: number) {
  const a0 = i * STEP - Math.PI / 2 + pad;
  const a1 = (i + 1) * STEP - Math.PI / 2 - pad;
  const p = (a: number, rr: number) => `${(Math.cos(a) * rr).toFixed(2)} ${(Math.sin(a) * rr).toFixed(2)}`;
  if (r <= r0 + 0.5) return "";
  const mid = (a0 + a1) / 2;
  // 바깥 끝을 살짝 볼록하게: 양 끝 모서리 → 가운데 끝점(r 보다 조금 더) 으로 이어지는 곡선
  const tip = r + (r - r0) * 0.08;
  return `M ${p(a0, r0)} L ${p(a0, r)} Q ${p(a0 + (mid - a0) * 0.35, tip)} ${p(mid, tip)} Q ${p(a1 - (a1 - mid) * 0.35, tip)} ${p(a1, r)} L ${p(a1, r0)} A ${r0} ${r0} 0 0 0 ${p(a0, r0)} Z`;
}

/** 넓이가 수에 비례하도록 제곱근 */
const radius = (n: number, max: number, r0: number, R: number) => (n > 0 && max > 0 ? r0 + (R - r0) * Math.sqrt(n / max) : r0);

/**
 * 내 플레이버 휠(꽃잎 차트). total = 전체 기록 수, hit = 거른 뒤 수(없으면 total 만 진하게).
 * 꽃잎을 누르면 onPick(대분류 id).
 */
export function FlavorRose({
  total,
  hit,
  focus,
  onPick,
}: {
  total: Map<string, number>;
  hit?: Map<string, number>;
  focus?: string | null;
  onPick: (id: string) => void;
}) {
  const R = 112;
  const r0 = 22;
  const max = Math.max(1, ...total.values());
  return (
    <svg viewBox="-200 -150 400 300" className="mx-auto block w-full max-w-[420px] select-none" role="group" aria-label="내 플레이버 휠">
      {/* 눈금 고리 */}
      {[0.25, 0.5, 1].map((f) => (
        <circle key={f} r={radius(max * f, max, r0, R)} fill="none" stroke="var(--color-line)" strokeDasharray="2 4" />
      ))}
      {PETALS.map((p, i) => {
        const n = total.get(p.id) ?? 0;
        const h = hit ? (hit.get(p.id) ?? 0) : n;
        const dim = focus && focus !== p.id;
        const mid = (i + 0.5) * STEP - Math.PI / 2;
        const lx = Math.cos(mid) * (R + 18);
        const ly = Math.sin(mid) * (R + 18);
        const anchor = Math.abs(lx) < 20 ? "middle" : lx > 0 ? "start" : "end";
        return (
          <g
            key={p.id}
            role="button"
            tabIndex={0}
            aria-label={`${p.ko} ${n}개 기록`}
            onClick={() => onPick(p.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick(p.id)}
            className="cursor-pointer outline-none"
            style={{ opacity: dim ? 0.35 : 1, transition: "opacity .2s" }}
          >
            {/* 누르기 쉬운 넓은 영역(빈 꽃잎 포함) */}
            <path d={petalPath(i, r0, R + 8, 0.01)} fill="transparent" />
            <path d={petalPath(i, r0, R, 0.035)} fill={p.color} opacity={0.08} />
            {n > 0 && <path d={petalPath(i, r0, radius(n, max, r0, R), 0.035)} fill={p.color} opacity={hit ? 0.3 : 0.9} />}
            {hit && h > 0 && <path d={petalPath(i, r0, radius(h, max, r0, R), 0.035)} fill={p.color} opacity={0.95} />}
            {focus === p.id && <path d={petalPath(i, r0, R, 0.035)} fill="none" stroke={p.color} strokeWidth={2} />}
            <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" fontSize={12} fontWeight={600} fill="var(--color-ink)">
              {p.ko}
            </text>
            <text x={lx} y={ly + 14} textAnchor={anchor} dominantBaseline="middle" fontSize={11} fill="var(--color-sub)">
              {hit ? `${h}/${n}` : n}
            </text>
          </g>
        );
      })}
      <circle r={r0 - 3} fill="var(--color-card)" stroke="var(--color-line)" />
    </svg>
  );
}

/** 기록 목록용 작은 휠: 갈래마다 노트 수(1·2·3개 이상)에 따라 꽃잎 길이 */
export function MiniRose({ tags, size = 40 }: { tags: string[]; size?: number }) {
  const tally = petalTally(tags);
  if (!tally.size) return null;
  const R = 19;
  const r0 = 4;
  return (
    <svg viewBox="-20 -20 40 40" width={size} height={size} aria-hidden className="shrink-0">
      <circle r={R} fill="var(--color-cream)" />
      {PETALS.map((p, i) => {
        const n = tally.get(p.id) ?? 0;
        if (!n) return null;
        const r = r0 + (R - r0) * (n >= 3 ? 1 : n === 2 ? 0.8 : 0.6);
        return <path key={p.id} d={petalPath(i, r0, r, 0.05)} fill={p.color} />;
      })}
    </svg>
  );
}
