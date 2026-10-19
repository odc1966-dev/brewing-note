"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";
import { resolveTag } from "@/lib/flavorWheel";
import { countNotes, countPetals, filterRecs, petalOf, toRecs, type Rec } from "@/lib/flavorMap";
import { tagLabel } from "@/lib/constants";
import { FlavorRose } from "@/components/FlavorRose";
import { BrewItem, CafeItem } from "@/components/Items";
import { Card, Empty, Header, Segment } from "@/components/ui";

type Src = "all" | "brew" | "cafe";

function Flavors() {
  const router = useRouter();
  const sp = useSearchParams();
  const brews = useStore((s) => s.brews);
  const cafes = useStore((s) => s.cafes);
  const beans = useStore((s) => s.beans);

  // 고른 상태는 주소에 둔다(기록을 열었다가 뒤로 와도 그대로)
  const src: Src = sp.get("src") === "brew" ? "brew" : sp.get("src") === "cafe" ? "cafe" : "all";
  const nParam = sp.get("n") ?? "";
  const picks = useMemo(() => nParam.split(",").filter(Boolean), [nParam]);
  const all = sp.get("m") === "all";
  const focus = petalOf(sp.get("c") ?? "")?.id ?? null;

  const go = (next: { src?: Src; picks?: string[]; all?: boolean; focus?: string | null }) => {
    const v = { src, picks, all, focus, ...next };
    const q = new URLSearchParams();
    if (v.src !== "all") q.set("src", v.src);
    if (v.picks.length) q.set("n", v.picks.join(","));
    if (v.all) q.set("m", "all");
    if (v.focus) q.set("c", v.focus);
    const s = q.toString();
    router.replace(s ? `/flavors/?${s}` : "/flavors/", { scroll: false });
  };
  const toggle = (id: string) => go({ picks: picks.includes(id) ? picks.filter((p) => p !== id) : [...picks, id] });

  const beanMap = useMemo(() => new Map(beans.map((b) => [b.id, b])), [beans]);
  const recs = useMemo(() => toRecs(src === "cafe" ? [] : brews, src === "brew" ? [] : cafes), [brews, cafes, src]);
  const tagged = useMemo(() => recs.filter((r) => r.tags.some((t) => resolveTag(t))), [recs]);
  const shown = useMemo(() => filterRecs(tagged, picks, all), [tagged, picks, all]);
  const total = useMemo(() => countPetals(tagged), [tagged]);
  const hit = useMemo(() => (picks.length ? countPetals(shown) : undefined), [shown, picks.length]);

  // 펼친 갈래의 노트 목록: 중분류 → 세부 노트
  const notes = useMemo(() => {
    if (!focus) return [];
    const m = countNotes(tagged, focus);
    const rows = [...m.entries()].map(([id, n]) => ({ id, n, e: resolveTag(id)! })).filter((r) => r.e);
    const mids = rows.filter((r) => r.e.depth === 2).sort((a, b) => b.n - a.n);
    return mids.map((mid) => ({ ...mid, kids: rows.filter((r) => r.e.depth === 3 && r.id.startsWith(mid.id + ">")).sort((a, b) => b.n - a.n) }));
  }, [tagged, focus]);
  const fp = focus ? petalOf(focus)! : null;
  const maxN = Math.max(1, ...notes.map((r) => r.n));

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
            <Empty title="컵노트를 붙인 기록이 없어요" desc="추출·카페 기록에서 컵노트를 고르면 여기에 꽃잎으로 모여요." />
          </div>
        ) : (
          <>
            <Card className="mt-3 px-2 py-3">
              <p className="px-2 text-center text-xs text-sub">
                컵노트를 붙인 기록 {tagged.length}개 · 꽃잎이 길수록 그 갈래 노트가 자주 나왔어요
                {picks.length > 0 && " · 진한 부분이 지금 거른 기록"}
              </p>
              <FlavorRose total={total} hit={hit} focus={focus} onPick={(id) => go({ focus: focus === id ? null : id })} />
              <p className="px-2 text-center text-[11px] text-sub">꽃잎을 누르면 그 갈래의 노트가 아래에 펼쳐져요</p>
            </Card>

            {/* 갈래 바로 고르기(큰 버튼) */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[...total.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([id, n]) => {
                  const p = petalOf(id)!;
                  const on = focus === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => go({ focus: on ? null : id })}
                      className="flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm"
                      style={{ borderColor: on ? p.color : "var(--color-line)", background: on ? p.color + "18" : "var(--color-card)" }}
                    >
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: p.color }} />
                      <span className="flex-1 truncate font-semibold">{p.ko}</span>
                      <span className="text-xs text-sub">{n}</span>
                    </button>
                  );
                })}
            </div>

            {fp && (
              <Card className="mt-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: fp.color }} />
                  <h2 className="flex-1 font-bold">{fp.ko} 노트</h2>
                  <button
                    type="button"
                    onClick={() => toggle(fp.id)}
                    aria-pressed={picks.includes(fp.id)}
                    className="min-h-11 rounded-full border px-3 text-sm font-semibold"
                    style={picks.includes(fp.id) ? { background: fp.color, borderColor: fp.color, color: "#fff" } : { borderColor: fp.color, color: fp.color }}
                  >
                    {picks.includes(fp.id) ? "✓ 갈래 전체" : "갈래 전체로 거르기"}
                  </button>
                </div>
                <p className="mt-1 text-xs text-sub">노트를 누르면 그 노트가 있는 기록만 남아요. 막대 = 그 노트가 나온 기록 수 · * 표시는 SCA 휠 밖의 앱 추가 표현</p>
                <div className="mt-3 space-y-3">
                  {notes.map((mid) => (
                    <div key={mid.id}>
                      <NoteRow id={mid.id} n={mid.n} max={maxN} color={fp.color} on={picks.includes(mid.id)} onClick={() => toggle(mid.id)} strong />
                      {mid.kids.length > 0 && (
                        <div className="mt-1.5 space-y-1.5 pl-4">
                          {mid.kids.map((k) => (
                            <NoteRow key={k.id} id={k.id} n={k.n} max={maxN} color={fp.color} on={picks.includes(k.id)} onClick={() => toggle(k.id)} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* 고른 노트 */}
            {picks.length > 0 && (
              <Card className="mt-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {picks.map((id) => {
                    const c = petalOf(id.split(">")[0])?.color ?? "#7d8797";
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggle(id)}
                        aria-label={`${tagLabel(id)} 빼기`}
                        className="inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold text-white"
                        style={{ background: c }}
                      >
                        {tagLabel(id)} <X size={14} />
                      </button>
                    );
                  })}
                  <button type="button" onClick={() => go({ picks: [] })} className="min-h-9 px-2 text-sm text-sub underline">
                    모두 풀기
                  </button>
                </div>
                {picks.length > 1 && (
                  <div className="mt-3">
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
              </Card>
            )}

            <h2 className="mt-5 mb-2 px-1 text-[15px] font-bold">
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

function NoteRow({ id, n, max, color, on, onClick, strong = false }: { id: string; n: number; max: number; color: string; on: boolean; onClick: () => void; strong?: boolean }) {
  const e = resolveTag(id);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className="flex min-h-11 w-full items-center gap-2 rounded-xl border px-3 text-left"
      style={{ borderColor: on ? color : "var(--color-line)", background: on ? color + "1f" : "transparent" }}
    >
      <span className={`w-24 shrink-0 truncate text-sm ${strong ? "font-bold" : ""}`}>
        {on && "✓ "}
        {tagLabel(id)}
        {e?.extra && <span className="text-sub">*</span>}
      </span>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-cream">
        <span className="block h-full rounded-full" style={{ width: `${(n / max) * 100}%`, background: color, opacity: strong ? 0.9 : 0.6 }} />
      </span>
      <span className="w-6 shrink-0 text-right text-xs text-sub">{n}</span>
    </button>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Flavors />
    </Suspense>
  );
}
