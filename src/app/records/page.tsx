"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { tagLabel } from "@/lib/constants";
import { BrewItem, CafeItem } from "@/components/Items";
import { Empty, Header, Segment } from "@/components/ui";

type Tab = "brew" | "cafe";

/** YYYY-MM → "2026년 10월" */
const monthLabel = (d: string) => `${d.slice(0, 4)}년 ${Number(d.slice(5, 7))}월`;

function groupByMonth<T extends { date: string }>(list: T[]) {
  const out: [string, T[]][] = [];
  for (const x of list) {
    const m = x.date.slice(0, 7);
    const last = out[out.length - 1];
    if (last && last[0] === m) last[1].push(x);
    else out.push([m, [x]]);
  }
  return out;
}

function Records() {
  const router = useRouter();
  const tab: Tab = useSearchParams().get("tab") === "cafe" ? "cafe" : "brew";
  const brews = useStore((s) => s.brews);
  const cafes = useStore((s) => s.cafes);
  const beans = useStore((s) => s.beans);
  const [q, setQ] = useState("");

  const beanMap = useMemo(() => new Map(beans.map((b) => [b.id, b])), [beans]);
  const query = q.trim().toLowerCase();

  const brewList = useMemo(() => {
    const sorted = [...brews].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    if (!query) return sorted;
    return sorted.filter((b) => {
      const bean = beanMap.get(b.beanId);
      const hay = [bean?.name, bean?.roaster, bean?.origin, b.method, b.memo, ...b.tags.map(tagLabel)].join(" ").toLowerCase();
      return hay.includes(query);
    });
  }, [brews, beanMap, query]);

  const cafeList = useMemo(() => {
    const sorted = [...cafes].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    if (!query) return sorted;
    return sorted.filter((c) => [c.cafe, c.menu, c.beanInfo, c.memo, ...c.tags.map(tagLabel)].join(" ").toLowerCase().includes(query));
  }, [cafes, query]);

  const groups = tab === "brew" ? groupByMonth(brewList) : groupByMonth(cafeList);

  return (
    <div>
      <Header
        title="기록"
        right={
          <Link
            href={tab === "brew" ? "/brew/edit/" : "/cafe/edit/"}
            aria-label="새 기록"
            className="grid h-11 w-11 place-items-center rounded-full bg-espresso text-white"
          >
            <Plus size={22} />
          </Link>
        }
      />
      <div className="px-4">
        <Segment
          options={[
            { id: "brew", label: `추출 ${brews.length}` },
            { id: "cafe", label: `카페 ${cafes.length}` },
          ]}
          value={tab}
          onChange={(t) => router.replace(t === "cafe" ? "/records/?tab=cafe" : "/records/")}
        />
        <label className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-card px-3">
          <Search size={18} className="text-sub" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tab === "brew" ? "원두, 로스터리, 추출 방식, 메모" : "카페, 메뉴, 메모"}
            className="w-full bg-transparent py-3 outline-none"
          />
        </label>

        <div className="mt-4">
          {groups.length === 0 ? (
            <Empty
              title={query ? "찾는 기록이 없어요" : tab === "brew" ? "추출 기록이 없어요" : "카페 기록이 없어요"}
              action={
                !query && (
                  <Link href={tab === "brew" ? "/brew/edit/" : "/cafe/edit/"} className="rounded-xl bg-espresso px-4 py-2.5 font-semibold text-white">
                    첫 기록 남기기
                  </Link>
                )
              }
            />
          ) : (
            groups.map(([m, list]) => (
              <section key={m} className="mb-5">
                <h2 className="mb-2 px-1 text-sm font-bold text-sub">
                  {monthLabel(m)} · {list.length}
                </h2>
                <div className="space-y-2">
                  {list.map((x) =>
                    tab === "brew" ? (
                      <BrewItem key={x.id} brew={x as (typeof brewList)[number]} bean={beanMap.get((x as (typeof brewList)[number]).beanId)} />
                    ) : (
                      <CafeItem key={x.id} log={x as (typeof cafeList)[number]} />
                    ),
                  )}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Records />
    </Suspense>
  );
}
