"use client";

import { cumulative, flow, recipeTotal } from "@/lib/recipe";
import type { RecipeStep } from "@/lib/types";
import { mmss } from "@/lib/util";

/** 기록 상세용 레시피 표: 단계 · 시작(계획/실제) · 이번 g · 누적 g · 방식 */
export default function RecipeView({ steps, actual }: { steps: RecipeStep[]; actual?: (number | null)[] }) {
  const cum = cumulative(steps);
  const hasActual = actual?.some((a) => a !== null);
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <table className="w-full text-sm">
        <thead className="bg-cream text-[11px] text-sub">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">단계</th>
            <th className="px-1 py-2 text-right font-semibold">시작</th>
            <th className="px-1 py-2 text-right font-semibold">이번</th>
            <th className="px-3 py-2 text-right font-semibold">누적</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((s, i) => {
            const f = flow(s);
            const act = actual?.[i];
            const diff = act != null && s.at != null ? act - s.at : null;
            return (
              <tr key={s.id} className="border-t border-line align-top">
                <td className="px-3 py-2">
                  <div className="font-semibold">{s.label}</div>
                  {(s.styles.length > 0 || f || s.memo) && (
                    <div className="mt-0.5 text-[11px] leading-snug text-sub">
                      {[s.styles.join(" · "), s.duration ? `${s.duration}초${f ? ` (${f}g/초)` : ""}` : "", s.memo].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </td>
                <td className="px-1 py-2 text-right tabular-nums">
                  {s.at != null ? mmss(s.at) : "–"}
                  {hasActual && (
                    <div className={`text-[11px] ${diff && Math.abs(diff) >= 5 ? "text-orange-700" : "text-sub"}`}>
                      {act != null ? `실제 ${mmss(act)}` : "실제 –"}
                    </div>
                  )}
                </td>
                <td className="px-1 py-2 text-right tabular-nums">{s.amount != null ? `${s.amount}g` : "–"}</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{cum[i]}g</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="border-t border-line bg-bg/60 px-3 py-2 text-right text-xs text-sub">
        합계 {recipeTotal(steps)}g · {steps.length}단계{hasActual ? " · 실제 시각은 타이머 기록(5초 이상 차이는 주황색)" : ""}
      </div>
    </div>
  );
}
