"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Coffee, PackageOpen, Store } from "lucide-react";
import { useStore } from "@/lib/store";
import { BrewItem, CafeItem, FreshBadge, StockBar } from "@/components/Items";
import { stockOf } from "@/lib/stock";
import { Card, Empty, Section } from "@/components/ui";
import { daysBetween, today } from "@/lib/util";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "늦은 밤에도 한 잔,";
  if (h < 11) return "좋은 아침이에요,";
  if (h < 17) return "오후의 한 잔,";
  return "오늘 하루도 수고했어요,";
}

export default function Home() {
  const brews = useStore((s) => s.brews);
  const cafes = useStore((s) => s.cafes);
  const beans = useStore((s) => s.beans);
  const nickname = useStore((s) => s.settings.nickname);

  const beanMap = useMemo(() => new Map(beans.map((b) => [b.id, b])), [beans]);

  const recent = useMemo(() => {
    const all = [
      ...brews.map((b) => ({ type: "brew" as const, date: b.date, at: b.createdAt, brew: b })),
      ...cafes.map((c) => ({ type: "cafe" as const, date: c.date, at: c.createdAt, cafe: c })),
    ];
    return all.sort((a, b) => b.date.localeCompare(a.date) || b.at - a.at).slice(0, 5);
  }, [brews, cafes]);

  const stats = useMemo(() => {
    const t = today();
    const inDays = (d: string, n: number) => {
      const x = daysBetween(d, t);
      return x !== null && x >= 0 && x < n;
    };
    const week = brews.filter((b) => inDays(b.date, 7)).length + cafes.filter((c) => inDays(c.date, 7)).length;
    const rated = brews.filter((b) => b.rating > 0);
    const avg = rated.length ? rated.reduce((s, b) => s + b.rating, 0) / rated.length : 0;
    return { week, total: brews.length + cafes.length, avg };
  }, [brews, cafes]);

  const activeBeans = beans.filter((b) => !b.archived).sort((a, b) => (b.roastDate || "").localeCompare(a.roastDate || "") || b.createdAt - a.createdAt);

  const lowBeans = activeBeans
    .map((b) => ({ b, st: stockOf(b, brews) }))
    .filter((x) => x.st && (x.st.low || x.st.empty));

  return (
    <div className="px-4 pt-8">
      <p className="text-sub">{greeting()}</p>
      <h1 className="text-[28px] font-extrabold leading-tight">{nickname || "홈 바리스타"}님</h1>

      <Link
        href="/brew/edit/"
        className="mt-6 flex items-center justify-center gap-2.5 rounded-2xl bg-espresso py-5 text-[17px] font-bold text-white shadow-md active:opacity-90"
      >
        <Coffee size={22} /> 오늘의 커피 기록하기
      </Link>
      <Link
        href="/cafe/edit/"
        className="mt-2 flex items-center justify-center gap-2 rounded-2xl border border-line bg-card py-3.5 font-semibold active:bg-cream"
      >
        <Store size={19} /> 카페에서 마신 커피 기록
      </Link>

      {lowBeans.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {lowBeans.map(({ b, st }) => (
            <Link key={b.id} href={`/beans/edit/?id=${b.id}`} className="flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2.5 text-sm text-orange-800">
              <PackageOpen size={18} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate">
                <b>{b.name}</b> {st!.empty ? "원두를 다 썼어요" : `원두가 곧 떨어져요 · ${st!.remaining}g`}
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-2">
        {[
          ["이번 주", `${stats.week}잔`],
          ["전체 기록", `${stats.total}`],
          ["평균 별점", stats.avg ? stats.avg.toFixed(1) : "–"],
        ].map(([k, v]) => (
          <Card key={k} className="!p-3 text-center">
            <div className="text-xs text-sub">{k}</div>
            <div className="mt-0.5 text-xl font-extrabold">{v}</div>
          </Card>
        ))}
      </div>

      {activeBeans.length > 0 && (
        <Section title="지금 마시는 원두">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {activeBeans.map((b) => (
              <Link key={b.id} href={`/beans/edit/?id=${b.id}`} className="w-44 shrink-0 rounded-2xl border border-line bg-card p-3">
                <div className="truncate font-semibold">{b.name}</div>
                <div className="mb-2 truncate text-xs text-sub">{b.roaster || " "}</div>
                <FreshBadge roastDate={b.roastDate} />
                {(() => {
                  const st = stockOf(b, brews);
                  return st && <StockBar stock={st} compact />;
                })()}
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section
        title="최근 기록"
        action={
          recent.length > 0 && (
            <Link href="/records/" className="text-sm text-accent">
              모두 보기
            </Link>
          )
        }
      >
        {recent.length === 0 ? (
          <Empty title="아직 기록이 없어요" desc="첫 잔을 기록하면 여기에 보여요." />
        ) : (
          <div className="space-y-2">
            {recent.map((r) =>
              r.type === "brew" ? (
                <BrewItem key={r.brew.id} brew={r.brew} bean={beanMap.get(r.brew.beanId)} />
              ) : (
                <CafeItem key={r.cafe.id} log={r.cafe} />
              ),
            )}
          </div>
        )}
      </Section>
    </div>
  );
}
