"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bean as BeanIcon, ChevronRight, Star } from "lucide-react";
import { photoURL } from "@/lib/store";
import type { Bean, Brew, CafeLog } from "@/lib/types";
import { fmtDate } from "@/lib/util";
import { Empty } from "./ui";

export interface BeanLogEntry {
  key: string;
  bean?: Bean; // 연결된 원두(없으면 예전 카페 기록의 글자만 있는 원두)
  name: string;
  sub: string;
  roaster: string; // 로스터리(카페 원두·글자 원두는 카페 이름)
  origin: string;
  brewCount: number;
  cafeCount: number;
  avg: number | null;
  lastDate: string;
  href: string;
}

/** 추출·카페 기록에 나온 원두를 한 목록으로 모은다 */
export function buildBeanLog(beans: Bean[], brews: Brew[], cafes: CafeLog[]): BeanLogEntry[] {
  const out: BeanLogEntry[] = [];
  for (const b of beans) {
    const bs = brews.filter((x) => x.beanId === b.id);
    const cs = cafes.filter((x) => x.beanId === b.id);
    if (!bs.length && !cs.length && !b.cafeOnly) continue;
    const rated = [...bs, ...cs].filter((x) => x.rating > 0);
    const dates = [...bs, ...cs].map((x) => x.date).sort();
    out.push({
      key: b.id,
      bean: b,
      name: b.name,
      sub: [b.roaster, b.origin, b.process].filter(Boolean).join(" · "),
      roaster: b.roaster.trim(),
      origin: b.origin.trim(),
      brewCount: bs.length,
      cafeCount: cs.length,
      avg: rated.length ? rated.reduce((s, x) => s + x.rating, 0) / rated.length : null,
      lastDate: dates[dates.length - 1] ?? "",
      href: `/beans/edit/?id=${b.id}`,
    });
  }
  // 원두 연결 기능 전에 글자로만 적은 카페 원두
  const loose = new Map<string, CafeLog[]>();
  for (const c of cafes) {
    if ((c.beanId && beans.some((b) => b.id === c.beanId)) || !c.beanInfo.trim()) continue;
    const k = c.beanInfo.trim();
    loose.set(k, [...(loose.get(k) ?? []), c]);
  }
  for (const [name, cs] of loose) {
    const rated = cs.filter((x) => x.rating > 0);
    const latest = cs.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
    out.push({
      key: "text:" + name,
      name,
      sub: [...new Set(cs.map((c) => c.cafe).filter(Boolean))].join(", "),
      roaster: cs.map((c) => c.cafe.trim()).find(Boolean) ?? "",
      origin: "",
      brewCount: 0,
      cafeCount: cs.length,
      avg: rated.length ? rated.reduce((s, x) => s + x.rating, 0) / rated.length : null,
      lastDate: latest.date,
      href: `/cafe/?id=${latest.id}`,
    });
  }
  return out.sort((a, b) => b.lastDate.localeCompare(a.lastDate) || a.name.localeCompare(b.name));
}

function Thumb({ id }: { id?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (id) photoURL(id).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [id]);
  return (
    <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-cream text-accent">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="원두 사진" className="h-full w-full object-cover" />
      ) : (
        <BeanIcon size={24} />
      )}
    </span>
  );
}

export const filterBeanLog = (entries: BeanLogEntry[], query: string) => {
  const q = query.trim().toLowerCase();
  return q ? entries.filter((e) => (e.name + " " + e.sub).toLowerCase().includes(q)) : entries;
};

export function BeanLogItem({ e }: { e: BeanLogEntry }) {
  return (
    <Link href={e.href} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3 active:bg-cream">
      <Thumb id={e.bean?.photos?.[0]} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate font-semibold">{e.name}</span>
          {e.bean?.cafeOnly && <span className="shrink-0 rounded-full bg-cream px-1.5 py-0.5 text-[10px]">카페</span>}
          {e.bean?.archived && <span className="shrink-0 rounded-full bg-stone-200 px-1.5 py-0.5 text-[10px]">보관함</span>}
        </span>
        <span className="block truncate text-xs text-sub">{e.sub || " "}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1 text-[11px]">
          {e.brewCount > 0 && <span className="rounded-full bg-accent-soft px-2 py-0.5 font-semibold text-accent">추출 {e.brewCount}</span>}
          {e.cafeCount > 0 && <span className="rounded-full bg-cream px-2 py-0.5 font-semibold">카페 {e.cafeCount}</span>}
          {e.avg !== null && (
            <span className="flex items-center gap-0.5 font-semibold text-[#b7791f]">
              <Star size={11} fill="currentColor" strokeWidth={0} />
              {e.avg.toFixed(1)}
            </span>
          )}
          {e.lastDate && <span className="text-sub">{fmtDate(e.lastDate)}</span>}
        </span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-sub" />
    </Link>
  );
}

export default function BeanLogList({ entries, query }: { entries: BeanLogEntry[]; query: string }) {
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? entries.filter((e) => (e.name + " " + e.sub).toLowerCase().includes(q)) : entries;
  }, [entries, query]);

  if (!list.length)
    return (
      <Empty
        title={query ? "찾는 원두가 없어요" : "기록된 원두가 없어요"}
        desc={query ? undefined : "추출 기록에서 고른 원두와 카페 기록에 적은 원두가 여기에 모여요."}
      />
    );

  return (
    <div className="space-y-2">
      {list.map((e) => (
        <Link key={e.key} href={e.href} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3 active:bg-cream">
          <Thumb id={e.bean?.photos?.[0]} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate font-semibold">{e.name}</span>
              {e.bean?.cafeOnly && <span className="shrink-0 rounded-full bg-cream px-1.5 py-0.5 text-[10px]">카페</span>}
              {e.bean?.archived && <span className="shrink-0 rounded-full bg-stone-200 px-1.5 py-0.5 text-[10px]">보관함</span>}
            </span>
            <span className="block truncate text-xs text-sub">{e.sub || " "}</span>
            <span className="mt-1 flex flex-wrap items-center gap-1 text-[11px]">
              {e.brewCount > 0 && <span className="rounded-full bg-accent-soft px-2 py-0.5 font-semibold text-accent">추출 {e.brewCount}</span>}
              {e.cafeCount > 0 && <span className="rounded-full bg-cream px-2 py-0.5 font-semibold">카페 {e.cafeCount}</span>}
              {e.avg !== null && (
                <span className="flex items-center gap-0.5 font-semibold text-[#b7791f]">
                  <Star size={11} fill="currentColor" strokeWidth={0} />
                  {e.avg.toFixed(1)}
                </span>
              )}
              {e.lastDate && <span className="text-sub">{fmtDate(e.lastDate)}</span>}
            </span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-sub" />
        </Link>
      ))}
    </div>
  );
}
