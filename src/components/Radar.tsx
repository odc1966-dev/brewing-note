"use client";

import { useRef } from "react";
import { FLAVOR_AXES } from "@/lib/constants";
import type { Flavor } from "@/lib/types";

const MAX = 5;

export function radarPoints(flavor: Flavor, cx: number, cy: number, r: number) {
  return FLAVOR_AXES.map((a, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / FLAVOR_AXES.length;
    const v = Math.max(0, Math.min(MAX, flavor[a.key] ?? 0)) / MAX;
    return [cx + Math.cos(ang) * r * v, cy + Math.sin(ang) * r * v] as const;
  });
}

/**
 * 5축 레이더 차트. onChange 가 있으면 차트를 누르거나 끌어서 값을 바꿀 수 있다
 * (누른 방향에서 가장 가까운 축, 중심에서의 거리 = 값).
 */
export default function Radar({
  flavor,
  size = 240,
  onChange,
  compare,
}: {
  flavor: Flavor;
  size?: number;
  onChange?: (f: Flavor) => void;
  compare?: Flavor; // 비교용(점선)
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pad = 34;
  const r = size / 2 - pad;
  const c = size / 2;
  const n = FLAVOR_AXES.length;
  const axisAngle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;

  const poly = (pts: readonly (readonly [number, number])[]) => pts.map((p) => p.join(",")).join(" ");
  const ring = (k: number) =>
    poly(FLAVOR_AXES.map((_, i) => [c + Math.cos(axisAngle(i)) * r * k, c + Math.sin(axisAngle(i)) * r * k] as const));

  function handle(e: React.PointerEvent) {
    if (!onChange || !svgRef.current) return;
    const box = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * size - c;
    const y = ((e.clientY - box.top) / box.height) * size - c;
    const ang = Math.atan2(y, x);
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < n; i++) {
      let d = Math.abs(ang - axisAngle(i));
      d = Math.min(d, 2 * Math.PI - d);
      if (d < bestD) (bestD = d), (best = i);
    }
    const along = x * Math.cos(axisAngle(best)) + y * Math.sin(axisAngle(best));
    const v = Math.max(0, Math.min(MAX, Math.round((along / r) * MAX)));
    const key = FLAVOR_AXES[best].key;
    if (flavor[key] !== v) onChange({ ...flavor, [key]: v });
  }

  const pts = radarPoints(flavor, c, c, r);
  const has = FLAVOR_AXES.some((a) => flavor[a.key] > 0);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${size} ${size}`}
      className={`mx-auto block w-full ${onChange ? "cursor-pointer touch-none" : ""}`}
      style={{ maxWidth: size }}
      role="img"
      aria-label={"플레이버 프로필: " + FLAVOR_AXES.map((a) => `${a.label} ${flavor[a.key]}`).join(", ")}
      onPointerDown={(e) => {
        if (!onChange) return;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        handle(e);
      }}
      onPointerMove={(e) => e.buttons && handle(e)}
    >
      {[1, 2, 3, 4, 5].map((k) => (
        <polygon key={k} points={ring(k / MAX)} fill={k === 5 ? "#fffdf9" : "none"} stroke="#e7dccd" strokeWidth={1} />
      ))}
      {FLAVOR_AXES.map((a, i) => (
        <line
          key={a.key}
          x1={c}
          y1={c}
          x2={c + Math.cos(axisAngle(i)) * r}
          y2={c + Math.sin(axisAngle(i)) * r}
          stroke="#e7dccd"
        />
      ))}
      {compare && (
        <polygon points={poly(radarPoints(compare, c, c, r))} fill="none" stroke="#8a7867" strokeDasharray="4 3" strokeWidth={1.5} />
      )}
      {has && <polygon points={poly(pts)} fill="#b5652b33" stroke="#b5652b" strokeWidth={2} strokeLinejoin="round" />}
      {has && pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={onChange ? 5 : 3} fill="#b5652b" />)}
      {FLAVOR_AXES.map((a, i) => {
        const lx = c + Math.cos(axisAngle(i)) * (r + 18);
        const ly = c + Math.sin(axisAngle(i)) * (r + 16);
        return (
          <text key={a.key} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={12} fill="#2e211a" fontWeight={600}>
            {a.label}
            {onChange && (
              <tspan fill="#b5652b" fontWeight={700}>
                {" "}
                {flavor[a.key]}
              </tspan>
            )}
          </text>
        );
      })}
    </svg>
  );
}

/** 레이더 아래에 두는 축별 0~5 버튼 (작은 화면·정확한 입력용) */
export function FlavorRows({ flavor, onChange }: { flavor: Flavor; onChange: (f: Flavor) => void }) {
  return (
    <div className="mt-2 space-y-1.5">
      {FLAVOR_AXES.map((a) => (
        <div key={a.key} className="flex items-center gap-2">
          <span className="w-10 shrink-0 text-sm font-semibold">{a.label}</span>
          <div className="grid flex-1 grid-cols-6 gap-1">
            {[0, 1, 2, 3, 4, 5].map((v) => {
              const on = flavor[a.key] === v;
              return (
                <button
                  key={v}
                  type="button"
                  aria-label={`${a.label} ${v}`}
                  onClick={() => onChange({ ...flavor, [a.key]: v })}
                  className={`h-9 rounded-lg text-sm font-semibold ${
                    on ? "bg-accent text-white" : v <= flavor[a.key] && v > 0 ? "bg-accent-soft text-accent" : "bg-card text-sub border border-line"
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
