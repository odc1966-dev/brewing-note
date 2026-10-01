"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Archive, ChevronRight, Plus, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { GEAR_KINDS, tagLabel } from "@/lib/constants";
import { archivedSortKey, summarize } from "@/lib/archive";
import { ArchiveItem } from "@/components/ArchiveUI";
import { BeanItem } from "@/components/Items";
import { stockOf } from "@/lib/stock";
import { Empty, Header, Segment } from "@/components/ui";

type Tab = "beans" | "archive" | "gear";

function Beans() {
  const router = useRouter();
  const t = useSearchParams().get("tab");
  const tab: Tab = t === "gear" ? "gear" : t === "archive" ? "archive" : "beans";
  const beans = useStore((s) => s.beans);
  const gear = useStore((s) => s.gear);
  const brews = useStore((s) => s.brews);
  const [q, setQ] = useState("");

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of brews) m.set(b.beanId, (m.get(b.beanId) ?? 0) + 1);
    return m;
  }, [brews]);

  const query = q.trim().toLowerCase();
  const match = (b: (typeof beans)[number]) =>
    !query || [b.name, b.roaster, b.origin, b.process, ...(b.cupNotes ?? []).map(tagLabel)].join(" ").toLowerCase().includes(query);
  const list = useMemo(() => beans.filter((b) => !b.archived && match(b)).sort((a, b) => b.createdAt - a.createdAt), [beans, query]); // eslint-disable-line react-hooks/exhaustive-deps
  const archived = useMemo(
    () =>
      beans
        .filter((b) => b.archived && match(b))
        .map((b) => ({ b, s: summarize(b.id, brews) }))
        .sort((x, y) => archivedSortKey(y.b, y.s) - archivedSortKey(x.b, x.s)),
    [beans, brews, query], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const archivedTotal = beans.filter((b) => b.archived).length;
  const go = (t: Tab) => router.replace(t === "beans" ? "/beans/" : `/beans/?tab=${t}`);

  return (
    <div>
      <Header
        title="원두·장비"
        right={
          <Link
            href={tab === "gear" ? "/gear/edit/" : "/beans/edit/"}
            aria-label="추가"
            className="grid h-11 w-11 place-items-center rounded-full bg-espresso text-white"
          >
            <Plus size={22} />
          </Link>
        }
      />
      <div className="px-4">
        <Segment
          options={[
            { id: "beans", label: `원두 ${beans.length - archivedTotal}` },
            { id: "archive", label: `보관함 ${archivedTotal}` },
            { id: "gear", label: `장비 ${gear.length}` },
          ]}
          value={tab}
          onChange={go}
        />

        {tab !== "gear" ? (
          <>
            <label className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-card px-3">
              <Search size={18} className="text-sub" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={tab === "archive" ? "보관함에서 찾기 (원두, 로스터리, 컵노트)" : "원두, 로스터리, 원산지, 컵노트"}
                className="w-full bg-transparent py-3 outline-none"
              />
            </label>
            {tab === "archive" ? (
              <div className="mt-4 space-y-2">
                {archived.length === 0 ? (
                  <Empty
                    title={query ? "찾는 원두가 없어요" : "보관함이 비어 있어요"}
                    desc={query ? undefined : "다 마신 원두는 원두 화면의 ‘보관함으로 옮기기’로 여기에 모여요. 기록과 베스트 레시피도 함께 남아요."}
                  />
                ) : (
                  archived.map(({ b, s }) => <ArchiveItem key={b.id} bean={b} summary={s} />)
                )}
              </div>
            ) : (
            <div className="mt-4 space-y-2">
              {list.length === 0 ? (
                <Empty
                  title={query ? "찾는 원두가 없어요" : "등록한 원두가 없어요"}
                  desc={query ? undefined : "원두를 등록하면 로스팅 후 며칠 지났는지 보여 줘요."}
                  action={
                    !query && (
                      <Link href="/beans/edit/" className="rounded-xl bg-espresso px-4 py-2.5 font-semibold text-white">
                        원두 등록
                      </Link>
                    )
                  }
                />
              ) : (
                list.map((b) => <BeanItem key={b.id} bean={b} count={counts.get(b.id) ?? 0} stock={stockOf(b, brews)} />)
              )}
              {!query && archivedTotal > 0 && (
                <button onClick={() => go("archive")} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-sm text-sub">
                  <Archive size={16} /> 다 마신 원두 {archivedTotal}개는 보관함에 있어요
                </button>
              )}
            </div>
            )}
          </>
        ) : (
          <div className="mt-4">
            {gear.length === 0 ? (
              <Empty
                title="등록한 장비가 없어요"
                desc="그라인더·드리퍼 등을 등록하면 기록할 때 고를 수 있어요."
                action={
                  <Link href="/gear/edit/" className="rounded-xl bg-espresso px-4 py-2.5 font-semibold text-white">
                    장비 등록
                  </Link>
                }
              />
            ) : (
              GEAR_KINDS.map((k) => {
                const items = gear.filter((g) => g.kind === k.id);
                if (!items.length) return null;
                return (
                  <section key={k.id} className="mb-4">
                    <h2 className="mb-2 px-1 text-sm font-bold text-sub">{k.label}</h2>
                    <div className="space-y-2">
                      {items.map((g) => (
                        <Link
                          key={g.id}
                          href={`/gear/edit/?id=${g.id}`}
                          className="flex items-center gap-2 rounded-2xl border border-line bg-card px-4 py-3.5 active:bg-cream"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold">{g.name}</span>
                            {g.memo && <span className="block truncate text-xs text-sub">{g.memo}</span>}
                          </span>
                          <ChevronRight size={18} className="text-sub" />
                        </Link>
                      ))}
                    </div>
                  </section>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Beans />
    </Suspense>
  );
}
