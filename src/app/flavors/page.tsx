"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";
import { resolveTag } from "@/lib/flavorWheel";
import { filterRecs, tagUnder, toRecs, type Rec } from "@/lib/flavorMap";
import { GEO, segOf } from "@/lib/sunburst";
import { tagColor, tagLabel } from "@/lib/constants";
import { SunburstWheel } from "@/components/Sunburst";
import { BrewItem, CafeItem } from "@/components/Items";
import { Card, Empty, Header, Segment } from "@/components/ui";

type Src = "all" | "brew" | "cafe";

function Flavors() {
  const router = useRouter();
  const sp = useSearchParams();
  const brews = useStore((s) => s.brews);
  const cafes = useStore((s) => s.cafes);
  const beans = useStore((s) => s.beans);
  const [moreNotes, setMoreNotes] = useState(false);

  // 고른 상태는 주소에 둔다(기록을 열었다가 뒤로 와도 그대로)
  const src: Src = sp.get("src") === "brew" ? "brew" : sp.get("src") === "cafe" ? "cafe" : "all";
  const nParam = sp.get("n") ?? "";
  const picks = useMemo(() => nParam.split(",").filter(Boolean), [nParam]);
  const all = sp.get("m") === "all";

  const go = (next: { src?: Src; picks?: string[]; all?: boolean }) => {
    const v = { src, picks, all, ...next };
    const q = new URLSearchParams();
    if (v.src !== "all") q.set("src", v.src);
    if (v.picks.length) q.set("n", v.picks.join(","));
    if (v.all) q.set("m", "all");
    const s = q.toString();
    router.replace(s ? `/flavors/?${s}` : "/flavors/", { scroll: false });
  };
  const toggle = (id: string) => go({ picks: picks.includes(id) ? picks.filter((p) => p !== id) : [...picks, id] });

  const beanMap = useMemo(() => new Map(beans.map((b) => [b.id, b])), [beans]);
  const recs = useMemo(() => toRecs(src === "cafe" ? [] : brews, src === "brew" ? [] : cafes), [brews, cafes, src]);
  const tagged = useMemo(() => recs.filter((r) => r.tags.some((t) => resolveTag(t))), [recs]);
  const shown = useMemo(() => filterRecs(tagged, picks, all), [tagged, picks, all]);

  // 휠 칸마다 그 칸(아래 노트 포함)이 나온 기록 수
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of GEO.segs) {
      const n = tagged.filter((r) => r.tags.some((t) => tagUnder(t, s.id))).length;
      if (n) m.set(s.id, n);
    }
    return m;
  }, [tagged]);

  // 기록에 나온 노트(휠 밖 앱 추가 표현 포함), 많이 나온 순
  const noteRows = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of tagged) new Set(r.tags.filter((t) => resolveTag(t))).forEach((t) => m.set(t, (m.get(t) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1] || tagLabel(a[0]).localeCompare(tagLabel(b[0]), "ko"));
  }, [tagged]);
  const maxN = Math.max(1, ...noteRows.map((r) => r[1]));
  const rows = moreNotes ? noteRows : noteRows.slice(0, 8);

  const chipStyle = (id: string) => {
    const s = segOf(id);
    return s ? { background: s.fill, color: s.text } : { background: tagColor(id), color: "#fff" };
  };

  return (
    <div>
      <Header title="내 플레이버 휠" back />
      <div className="px-4 pb-8">
        <Segment
          options={[
            { id: "all", label: "전체" },
            { id: "brew", label: `추출 ${brews.length}` },
            { id: "cafe", label: `카페 ${cafes.length}` },
          ]}
          value={src}
          onChange={(v) => go({ src: v })}
        />

        {!tagged.length ? (
          <div className="mt-4">
            <Empty title="컵노트를 붙인 기록이 없어요" desc="추출·카페 기록에서 컵노트를 고르면 휠에 쌓여요." />
          </div>
        ) : (
          <>
            <Card className="mt-3 px-2.5 py-3">
              <SunburstWheel counts={counts} selected={picks} onPick={toggle} />
            </Card>

            {/* 고른 노트 */}
            <div className="mt-3 flex min-h-9 flex-wrap items-center gap-1.5">
              {picks.length === 0 ? (
                <span className="px-1 text-sm text-sub">휠의 칸이나 아래 노트를 누르면 그 노트가 있는 기록만 남아요</span>
              ) : (
                <>
                  {picks.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggle(id)}
                      aria-label={`${tagLabel(id)} 빼기`}
                      className="inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold"
                      style={chipStyle(id)}
                    >
                      {tagLabel(id)} <X size={14} />
                    </button>
                  ))}
                  <button type="button" onClick={() => go({ picks: [] })} className="min-h-9 px-2 text-sm text-sub underline">
                    모두 풀기
                  </button>
                </>
              )}
            </div>
            {picks.length > 1 && (
              <div className="mt-2">
                <Segment
                  options={[
                    { id: "any", label: "하나라도 있는 기록" },
                    { id: "all", label: "모두 있는 기록" },
                  ]}
                  value={all ? "all" : "any"}
                  onChange={(v) => go({ all: v === "all" })}
                />
              </div>
            )}

            {/* 휠의 작은 칸 대신 크게 누를 수 있는 노트 목록 */}
            <Card className="mt-3">
              <h2 className="font-display text-[15px] font-bold">기록에 나온 노트</h2>
              <p className="mt-0.5 text-xs text-sub">막대 = 그 노트가 나온 기록 수 · * 표시는 SCA 휠 밖의 앱 추가 표현</p>
              <div className="mt-2.5 space-y-1.5">
                {rows.map(([id, n]) => {
                  const on = picks.includes(id);
                  const c = segOf(id)?.fill ?? tagColor(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(id)}
                      className="flex min-h-11 w-full items-center gap-2 rounded-xl border px-3 text-left"
                      style={{ borderColor: on ? "var(--color-ink)" : "var(--color-line)", background: on ? "var(--color-cream)" : "transparent" }}
                    >
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c }} />
                      <span className={`w-28 shrink-0 truncate text-sm ${on ? "font-bold" : ""}`}>
                        {on && "✓ "}
                        {tagLabel(id)}
                        {resolveTag(id)?.extra && <span className="text-sub">*</span>}
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-cream">
                        <span className="block h-full rounded-full" style={{ width: `${(n / maxN) * 100}%`, background: c }} />
                      </span>
                      <span className="w-6 shrink-0 text-right text-xs text-sub">{n}</span>
                    </button>
                  );
                })}
              </div>
              {noteRows.length > 8 && (
                <button type="button" onClick={() => setMoreNotes((v) => !v)} className="mt-2 min-h-11 w-full text-sm font-semibold text-accent">
                  {moreNotes ? "접기" : `노트 ${noteRows.length - 8}개 더 보기`}
                </button>
              )}
            </Card>

            <h2 className="font-display mt-5 mb-2 px-1 text-[16px] font-bold">
              {picks.length ? `거른 기록 ${shown.length}개` : `기록 ${shown.length}개`}
            </h2>
            {shown.length ? (
              <div className="space-y-2">
                {shown.map((r: Rec) =>
                  r.kind === "brew" ? <BrewItem key={r.brew.id} brew={r.brew} bean={beanMap.get(r.brew.beanId)} /> : <CafeItem key={r.cafe.id} log={r.cafe} />,
                )}
              </div>
            ) : (
              <Empty title="고른 노트를 모두 가진 기록이 없어요" desc="'하나라도 있는 기록'으로 바꾸거나 노트를 줄여 보세요." />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Flavors />
    </Suspense>
  );
}
