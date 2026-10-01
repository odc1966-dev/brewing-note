"use client";

import Link from "next/link";
import { ChevronRight, Coffee, Store } from "lucide-react";
import type { Bean, Brew, CafeLog } from "@/lib/types";
import type { Stock } from "@/lib/stock";
import { fmtDate, freshness, ratio } from "@/lib/util";
import { Stars, TagChip } from "./ui";

export function BrewItem({ brew, bean }: { brew: Brew; bean?: Bean }) {
  const r = ratio(brew.dose, brew.water);
  return (
    <Link href={`/brew/?id=${brew.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3.5 active:bg-cream">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
        <Coffee size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">
          {bean?.name || "원두 미지정"}
          {bean?.roaster && <span className="font-normal text-sub"> · {bean.roaster}</span>}
        </span>
        <span className="block truncate text-xs text-sub">
          {[brew.method, r, fmtDate(brew.date)].filter(Boolean).join(" · ")}
        </span>
      </span>
      {brew.rating > 0 && <Stars value={brew.rating} size={13} />}
    </Link>
  );
}

export function CafeItem({ log }: { log: CafeLog }) {
  return (
    <Link href={`/cafe/?id=${log.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3.5 active:bg-cream">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream text-espresso">
        <Store size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">
          {log.menu || "메뉴"}
          {log.cafe && <span className="font-normal text-sub"> · {log.cafe}</span>}
        </span>
        <span className="block truncate text-xs text-sub">{fmtDate(log.date)}</span>
      </span>
      {log.rating > 0 && <Stars value={log.rating} size={13} />}
    </Link>
  );
}

const TONE = {
  rest: "bg-sky-100 text-sky-800",
  best: "bg-emerald-100 text-emerald-800",
  old: "bg-stone-200 text-stone-600",
};

export function FreshBadge({ roastDate }: { roastDate: string }) {
  const f = freshness(roastDate);
  if (!f) return null;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[f.tone]}`}>
      {f.days >= 0 ? `D+${f.days}` : `D${f.days}`} · {f.label}
    </span>
  );
}

/** 남은 원두 양 막대 */
export function StockBar({ stock, compact = false }: { stock: Stock; compact?: boolean }) {
  const color = stock.empty ? "#a8a29e" : stock.low ? "#c2410c" : "#3a2a20";
  return (
    <div className={compact ? "mt-2" : ""}>
      <div className="flex items-baseline justify-between text-[11px]">
        <span style={{ color }} className="font-semibold">
          {stock.empty ? "다 썼어요" : `남은 양 ${stock.remaining}g`}
          {!stock.empty && stock.cupsLeft !== null && ` · 약 ${stock.cupsLeft}잔`}
          {stock.low && " · 곧 떨어져요"}
        </span>
        {!compact && <span className="text-sub">{stock.weight}g 중</span>}
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream">
        <div className="h-full rounded-full" style={{ width: `${stock.pct * 100}%`, background: color }} />
      </div>
    </div>
  );
}

export function BeanItem({ bean, count, stock }: { bean: Bean; count: number; stock?: Stock | null }) {
  return (
    <Link
      href={`/beans/edit/?id=${bean.id}`}
      className={`block rounded-2xl border border-line bg-card px-4 py-3.5 active:bg-cream ${bean.archived ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-semibold">{bean.name}</span>
        <ChevronRight size={18} className="text-sub" />
      </div>
      <div className="mt-0.5 truncate text-xs text-sub">
        {[bean.roaster, bean.origin].filter(Boolean).join(" · ") || "로스터리 정보 없음"}
        {count > 0 && ` · ${count}잔`}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {bean.roast && <span className="rounded-full bg-espresso/85 px-2 py-0.5 text-[11px] text-white">{bean.roast}</span>}
        {bean.process && <span className="rounded-full bg-cream px-2 py-0.5 text-[11px]">{bean.process}</span>}
        {!bean.archived && <FreshBadge roastDate={bean.roastDate} />}
        {bean.archived && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px]">다 마심</span>}
        {(bean.cupNotes ?? []).slice(0, 4).map((t) => (
          <TagChip key={t} id={t} small />
        ))}
      </div>
      {stock && !bean.archived && <StockBar stock={stock} compact />}
    </Link>
  );
}

export function TagRow({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <TagChip key={t} id={t} />
      ))}
    </div>
  );
}
