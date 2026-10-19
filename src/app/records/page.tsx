"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Flower2, Plus, Search } from "lucide-react";
import { saveSettings, useStore } from "@/lib/store";
import { tagLabel } from "@/lib/constants";
import type { Brew, CafeLog } from "@/lib/types";
import { BrewItem, CafeItem } from "@/components/Items";
import { BeanLogItem, buildBeanLog, filterBeanLog, type BeanLogEntry } from "@/components/BeanLog";
import { FolderList, groupBy, type Group } from "@/components/FolderGroups";
import { Empty, Header, Segment } from "@/components/ui";

type Tab = "brew" | "cafe" | "beans";

/** YYYY-MM → "2026년 10월" */
const monthLabel = (d: string) => `${d.slice(0, 4)}년 ${Number(d.slice(5, 7))}월`;

/** 칸마다 고를 수 있는 보기 방식 (첫 번째가 기본) */
const VIEWS: Record<Tab, { id: string; label: string }[]> = {
  brew: [
    { id: "date", label: "날짜" },
    { id: "bean", label: "원두" },
    { id: "roaster", label: "로스터리" },
    { id: "method", label: "추출 방식" },
  ],
  cafe: [
    { id: "date", label: "날짜" },
    { id: "cafe", label: "카페" },
    { id: "bean", label: "원두" },
  ],
  beans: [
    { id: "recent", label: "최근 순" },
    { id: "roaster", label: "로스터리·카페" },
    { id: "origin", label: "원산지" },
    { id: "date", label: "날짜" },
  ],
};

function Records() {
  const router = useRouter();
  const tp = useSearchParams().get("tab");
  const tab: Tab = tp === "cafe" ? "cafe" : tp === "beans" ? "beans" : "brew";
  const brews = useStore((s) => s.brews);
  const cafes = useStore((s) => s.cafes);
  const beans = useStore((s) => s.beans);
  const views = useStore((s) => s.settings.recordViews);
  const [q, setQ] = useState("");

  const options = VIEWS[tab];
  const view = options.find((o) => o.id === views?.[tab])?.id ?? options[0].id;
  const setView = (id: string) => saveSettings({ recordViews: { ...views, [tab]: id } });

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

  const beanLog = useMemo(() => buildBeanLog(beans, brews, cafes), [beans, brews, cafes]);
  const beanList = useMemo(() => filterBeanLog(beanLog, q), [beanLog, q]);

  // 보기 방식에 따라 묶기
  const brewGroups: Group<Brew>[] = useMemo(() => {
    const d = (x: Brew) => x.date;
    const bean = (x: Brew) => beanMap.get(x.beanId);
    if (view === "bean") return groupBy(brewList, (x) => bean(x)?.name ?? "", d, { unknown: "원두 미지정" });
    if (view === "roaster") return groupBy(brewList, (x) => bean(x)?.roaster.trim() ?? "", d, { unknown: "로스터리 미지정" });
    if (view === "method") return groupBy(brewList, (x) => x.method, d, { unknown: "방식 미지정" });
    return groupBy(brewList, (x) => x.date.slice(0, 7), d, { byKeyDesc: true, labelOf: monthLabel });
  }, [brewList, beanMap, view]);

  const cafeGroups: Group<CafeLog>[] = useMemo(() => {
    const d = (x: CafeLog) => x.date;
    if (view === "cafe") return groupBy(cafeList, (x) => x.cafe.trim(), d, { unknown: "카페 미지정" });
    if (view === "bean") return groupBy(cafeList, (x) => beanMap.get(x.beanId ?? "")?.name ?? x.beanInfo.trim(), d, { unknown: "원두 미지정" });
    return groupBy(cafeList, (x) => x.date.slice(0, 7), d, { byKeyDesc: true, labelOf: monthLabel });
  }, [cafeList, beanMap, view]);

  const beanGroups: Group<BeanLogEntry>[] = useMemo(() => {
    const d = (x: BeanLogEntry) => x.lastDate;
    if (view === "roaster") return groupBy(beanList, (x) => x.roaster, d, { unknown: "로스터리 미지정" });
    if (view === "origin") return groupBy(beanList, (x) => x.origin, d, { unknown: "원산지 미지정" });
    if (view === "date") return groupBy(beanList, (x) => x.lastDate.slice(0, 7), d, { byKeyDesc: true, labelOf: monthLabel, unknown: "날짜 없음" });
    return [];
  }, [beanList, view]);

  const isDate = view === "date";
  const empty = tab === "brew" ? !brewList.length : tab === "cafe" ? !cafeList.length : !beanList.length;

  return (
    <div>
      <Header
        title="기록"
        right={
          <Link
            href={tab === "cafe" ? "/cafe/edit/" : tab === "beans" ? "/beans/edit/" : "/brew/edit/"}
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
            { id: "beans", label: `원두 ${beanLog.length}` },
          ]}
          value={tab}
          onChange={(t) => router.replace(t === "brew" ? "/records/" : `/records/?tab=${t}`)}
        />
        <Link
          href={tab === "cafe" ? "/flavors/?src=cafe" : tab === "brew" ? "/flavors/?src=brew" : "/flavors/"}
          className="mt-3 flex min-h-12 items-center gap-2 rounded-xl border border-line bg-card px-3 active:bg-cream"
        >
          <Flower2 size={18} className="text-accent" />
          <span className="flex-1 text-sm font-semibold">내 플레이버 휠</span>
          <span className="truncate text-xs text-sub">노트 모아 보기·거르기</span>
          <ChevronRight size={16} className="shrink-0 text-sub" />
        </Link>
        <label className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-card px-3">
          <Search size={18} className="text-sub" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tab === "brew" ? "원두, 로스터리, 추출 방식, 메모" : tab === "cafe" ? "카페, 메뉴, 메모" : "원두, 로스터리, 카페"}
            className="w-full bg-transparent py-3 outline-none"
          />
        </label>

        {/* 보기 방식 */}
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="shrink-0 pr-0.5 text-xs font-semibold text-sub">보기</span>
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={view === o.id}
              onClick={() => setView(o.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${view === o.id ? "border-espresso bg-espresso text-white" : "border-line bg-card"}`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="mt-3">
          {empty ? (
            <Empty
              title={
                query
                  ? "찾는 기록이 없어요"
                  : tab === "brew"
                    ? "추출 기록이 없어요"
                    : tab === "cafe"
                      ? "카페 기록이 없어요"
                      : "기록된 원두가 없어요"
              }
              desc={!query && tab === "beans" ? "추출 기록에서 고른 원두와 카페 기록에 적은 원두가 여기에 모여요." : undefined}
              action={
                !query &&
                tab !== "beans" && (
                  <Link href={tab === "brew" ? "/brew/edit/" : "/cafe/edit/"} className="rounded-xl bg-espresso px-4 py-2.5 font-semibold text-white">
                    첫 기록 남기기
                  </Link>
                )
              }
            />
          ) : tab === "beans" && view === "recent" ? (
            <div className="space-y-2">
              {beanList.map((e) => (
                <BeanLogItem key={e.key} e={e} />
              ))}
            </div>
          ) : tab === "brew" ? (
            <FolderList
              groups={brewGroups}
              render={(x) => <BrewItem key={x.id} brew={x} bean={beanMap.get(x.beanId)} />}
              defaultOpen={isDate}
              forceOpen={!!query}
              resetKey={tab + view}
              dateStyle={isDate}
            />
          ) : tab === "cafe" ? (
            <FolderList
              groups={cafeGroups}
              render={(x) => <CafeItem key={x.id} log={x} />}
              defaultOpen={isDate}
              forceOpen={!!query}
              resetKey={tab + view}
              dateStyle={isDate}
            />
          ) : (
            <FolderList
              groups={beanGroups}
              render={(e) => <BeanLogItem key={e.key} e={e} />}
              defaultOpen={isDate}
              forceOpen={!!query}
              resetKey={tab + view}
              dateStyle={isDate}
            />
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
