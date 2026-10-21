"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SEP } from "@/lib/flavorWheel";
import { GEO, R0, R1, R2, R3, arcPath, labelAt, segOf, type Seg } from "@/lib/sunburst";

const PAD = 300; // 막대·숫자까지 들어가는 반지름
const VB = [`-14 -${PAD} ${PAD + 14} ${PAD + 14}`, `-14 -14 ${PAD + 14} ${PAD + 14}`, `-${PAD} -14 ${PAD + 14} ${PAD + 14}`, `-${PAD} -${PAD} ${PAD + 14} ${PAD + 14}`];
const Q = Math.PI / 2;

/** 사분면마다 걸치는 갈래 이름(5° 넘게 걸친 것만) */
const Q_TITLES = [0, 1, 2, 3].map((q) =>
  GEO.segs
    .filter((s) => s.ring === 1 && Math.min(s.a1, (q + 1) * Q) - Math.max(s.a0, q * Q) > 0.09)
    .map((s) => s.ko)
    .join(" · "),
);

/**
 * 실제형 플레이버 휠. counts = 칸 id → 그 칸(아래 노트 포함)이 나온 기록 수.
 * 폰에서는 1/4씩 크게 보고(‹ › 또는 옆으로 밀기), 전체 보기는 위치 파악용.
 */
export function SunburstWheel({
  counts,
  selected,
  onPick,
}: {
  counts: Map<string, number>;
  selected: string[];
  onPick: (id: string) => void;
}) {
  const [q, setQ] = useState(0);
  const [full, setFull] = useState(false);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);

  const max = Math.max(1, ...GEO.segs.filter((s) => s.outer).map((s) => counts.get(s.id) ?? 0));
  const unit = Math.min(12, 44 / max);
  const sel = useMemo(() => new Set(selected), [selected]);
  const go = (d: number) => setQ((v) => (v + d + 4) % 4);

  const pick = (s: Seg) => {
    if (drag.current?.moved || s.def) return;
    onPick(s.id);
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        {!full ? (
          <>
            <button type="button" aria-label="이전 사분면" onClick={() => go(-1)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-white">
              <ChevronLeft size={20} />
            </button>
            <div className="min-w-0 flex-1 text-center">
              <div className="truncate text-sm font-bold">
                {q + 1}/4 · {Q_TITLES[q]}
              </div>
              <div className="text-[11px] text-sub">옆으로 밀거나 화살표로 넘겨요</div>
            </div>
            <button type="button" aria-label="다음 사분면" onClick={() => go(1)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-white">
              <ChevronRight size={20} />
            </button>
          </>
        ) : (
          <div className="flex-1 text-center text-sm font-bold">전체 휠 · 칸을 보려면 확대 보기</div>
        )}
      </div>

      <svg
        viewBox={full ? `-${PAD} -${PAD} ${PAD * 2} ${PAD * 2}` : VB[q]}
        className="mx-auto mt-2 block aspect-square w-full max-w-[420px] touch-pan-y select-none"
        role="group"
        aria-label="SCA 용어 플레이버 휠. 칸을 누르면 그 노트로 기록을 걸러요"
        onPointerDown={(e) => (drag.current = { x: e.clientX, moved: false })}
        onPointerMove={(e) => {
          if (drag.current && Math.abs(e.clientX - drag.current.x) > 12) drag.current.moved = true;
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          if (d && !full && Math.abs(e.clientX - d.x) > 50) go(e.clientX < d.x ? 1 : -1);
          setTimeout(() => (drag.current = null), 0);
        }}
      >
        {GEO.segs.map((s) => {
          const n = counts.get(s.id) ?? 0;
          const op = s.def ? 0.55 : n ? 1 : s.outer ? 0.4 : 0.6;
          return (
            <path
              key={s.id}
              d={arcPath(s.a0, s.a1, s.ri, s.ro)}
              fill={s.fill}
              opacity={op}
              stroke="var(--color-card)"
              strokeWidth={1.2}
              onClick={() => pick(s)}
              className={s.def ? "" : "cursor-pointer"}
            >
              <title>{`${s.ko}${s.def ? " (결점 노트)" : ` · ${n}개 기록`}`}</title>
            </path>
          );
        })}

        {/* 바깥 막대 = 기록 수 */}
        {GEO.segs
          .filter((s) => s.outer && (counts.get(s.id) ?? 0) > 0)
          .map((s) => {
            const n = counts.get(s.id)!;
            const len = n * unit;
            const l = labelAt(s, R3 + 8 + len);
            return (
              <g key={"bar" + s.id} pointerEvents="none">
                <path d={arcPath(s.a0 + 0.006, s.a1 - 0.006, R3 + 4, R3 + 4 + len)} fill={s.fill} stroke={s.text === "#FFFFFF" ? "none" : "rgba(43,29,21,.25)"} strokeWidth={0.6} />
                <text transform={l.transform} textAnchor={l.anchor} dominantBaseline="middle" fontSize={full ? 13 : 10} fontWeight={700} fill="var(--color-ink)">
                  {n}
                </text>
              </g>
            );
          })}

        {/* 고른 칸 테두리 */}
        {GEO.segs
          .filter((s) => sel.has(s.id))
          .map((s) => (
            <path key={"sel" + s.id} d={arcPath(s.a0, s.a1, s.ri, s.ro)} fill="none" stroke="var(--color-ink)" strokeWidth={2.6} pointerEvents="none" />
          ))}

        {/* 글자: 전체 보기에서는 갈래만 */}
        {GEO.segs
          .filter((s) => (full ? s.ring === 1 : true))
          .map((s) => {
            const n = counts.get(s.id) ?? 0;
            const r = s.ring === 1 ? R0 + 8 : s.ring === 2 ? R1 + 6 : R2 + 6;
            const l = labelAt(s, r);
            return (
              <text
                key={"t" + s.id}
                transform={l.transform}
                textAnchor={l.anchor}
                dominantBaseline="middle"
                fontSize={full ? 15 : s.ring === 1 ? 11.5 : s.ring === 2 ? 9.5 : 10}
                fontWeight={s.ring === 1 ? 700 : n ? 700 : 500}
                fill={s.text}
                opacity={s.outer && !n && !s.def ? 0.6 : 1}
                pointerEvents="none"
              >
                {s.ko}
              </text>
            );
          })}
        <circle r={R0 - 2} fill="var(--color-card)" />
      </svg>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
        <p className="text-[11px] leading-relaxed text-sub">
          바깥 막대·숫자 = 그 노트가 나온 기록 수 · 흐린 칸 = 아직 기록 없음 · 회색 = 결점 노트(고를 수 없음)
        </p>
        <button type="button" onClick={() => setFull((v) => !v)} className="min-h-11 rounded-full border border-line bg-white px-4 text-sm font-semibold">
          {full ? "확대 보기" : "전체 보기"}
        </button>
      </div>
    </div>
  );
}

/** 기록 목록용 작은 휠: 바탕은 흐린 9갈래, 기록에 붙인 노트는 갈래·중분류·세부 고리를 차례로 색칠 */
export function MiniWheel({ tags, size = 44 }: { tags: string[]; size?: number }) {
  const arcs = miniArcs(tags);
  if (!arcs.length) return null;
  return (
    <svg viewBox={`-${R3 + 4} -${R3 + 4} ${(R3 + 4) * 2} ${(R3 + 4) * 2}`} width={size} height={size} aria-hidden className="shrink-0">
      <circle r={R3} fill="var(--color-cream)" />
      {CATS.map((c) => (
        <path key={c.id} d={arcPath(c.a0, c.a1, R0, R1)} fill={c.fill} opacity={0.22} />
      ))}
      {arcs.map((a) => (
        <path key={a.key} d={a.d} fill={a.fill} stroke="var(--color-card)" strokeWidth={6} />
      ))}
      <circle r={R0} fill="var(--color-card)" />
    </svg>
  );
}

const CATS = GEO.segs.filter((s) => s.ring === 1);
const MIN_HALF = (8 * Math.PI) / 180; // 작은 그림에서 세부 칸이 보이도록 최소 16° 폭

export function miniArcs(tags: string[]) {
  const out = new Map<string, { key: string; d: string; fill: string }>();
  for (const t of tags) {
    const s = segOf(t);
    if (!s || s.ring === 1) continue;
    const parts = s.id.split(SEP);
    const cat = GEO.byId.get(parts[0])!;
    const sub = GEO.byId.get(parts.slice(0, 2).join(SEP))!;
    out.set("c" + cat.id, { key: "c" + cat.id, d: arcPath(cat.a0, cat.a1, R0, R1), fill: cat.fill });
    if (sub.outer) {
      out.set("s" + sub.id, { key: "s" + sub.id, d: arcPath(sub.a0, sub.a1, R1, R3), fill: sub.fill });
      continue;
    }
    out.set("s" + sub.id, { key: "s" + sub.id, d: arcPath(sub.a0, sub.a1, R1, R2), fill: sub.fill });
    if (s.ring === 3) {
      const m = (s.a0 + s.a1) / 2;
      const h = Math.max((s.a1 - s.a0) / 2, MIN_HALF);
      out.set("l" + s.id, { key: "l" + s.id, d: arcPath(m - h, m + h, R2, R3), fill: sub.fill });
    }
  }
  // 갈래 → 중분류 → 세부 순으로 그려 겹침이 자연스럽게
  return [...out.values()].sort((a, b) => "csl".indexOf(a.key[0]) - "csl".indexOf(b.key[0]));
}
