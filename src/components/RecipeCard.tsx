"use client";

import Link from "next/link";
import { ChevronRight, Snowflake } from "lucide-react";
import type { RecipeEntry } from "@/lib/recipeLib";

/** 레시피 목록 한 줄 */
export default function RecipeCard({ e }: { e: RecipeEntry }) {
  const r = e.r;
  const nums = [
    r.dose != null ? `${r.dose}g` : null,
    r.water != null ? `물 ${r.water}g` : null,
    r.ice ? `얼음 ${r.ice}g` : null,
    r.temp != null ? `${r.temp}°C` : null,
    `${r.steps.length}단계`,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link
      href={`/recipes/view/?id=${encodeURIComponent(e.key)}`}
      className="flex items-center gap-3 rounded-[18px] border border-line bg-card px-3.5 py-3 active:bg-cream"
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${
          r.serve === "ICE" ? "bg-sky-100 text-sky-800" : "bg-accent-soft text-accent"
        }`}
      >
        {r.serve === "ICE" ? <Snowflake size={18} /> : "HOT"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{r.name}</span>
        <span className="block truncate text-xs text-sub">
          {r.author}
          {r.year ? ` · ${r.year}` : ""} · {r.brewer}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-sub">{nums}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-sub" />
    </Link>
  );
}
