"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { REF_GROUPS } from "@/lib/refRecipes";
import { allEntries, type RecipeEntry } from "@/lib/recipeLib";
import { FolderList, type Group } from "@/components/FolderGroups";
import RecipeCard from "@/components/RecipeCard";
import { Empty, Header, Segment } from "@/components/ui";

type Tab = "mine" | "ref";
type Serve = "all" | "HOT" | "ICE";

function Recipes() {
  const router = useRouter();
  const tab: Tab = useSearchParams().get("tab") === "mine" ? "mine" : "ref";
  const settings = useStore((s) => s.settings);
  const [q, setQ] = useState("");
  const [serve, setServe] = useState<Serve>("all");

  const entries = useMemo(() => allEntries(settings), [settings]);
  const query = q.trim().toLowerCase();
  const pass = (e: RecipeEntry) =>
    (serve === "all" || e.r.serve === serve) &&
    (!query || [e.r.name, e.r.author, e.r.brewer, e.r.country, e.r.bean, e.r.year].join(" ").toLowerCase().includes(query));

  const mine = entries.filter((e) => e.kind === "my");
  const others = entries.filter((e) => e.kind !== "my");
  const shownMine = mine.filter(pass).sort((a, b) => (b.saved?.createdAt ?? 0) - (a.saved?.createdAt ?? 0));
  const groups: Group<RecipeEntry>[] = REF_GROUPS.map((g) => ({
    key: g.id,
    label: g.label,
    items: others.filter((e) => e.r.group === g.id && pass(e)),
    latest: "",
  })).filter((g) => g.items.length > 0);

  const count = (list: RecipeEntry[], s: Serve) => list.filter((e) => s === "all" || e.r.serve === s).length;
  const base = tab === "mine" ? mine : others;

  return (
    <div>
      <Header
        title="레시피"
        right={
          <Link
            href={tab === "mine" ? "/recipes/edit/?kind=my" : "/recipes/edit/?kind=c"}
            aria-label={tab === "mine" ? "내 레시피 만들기" : "다른 사람 레시피 추가"}
            className="grid h-11 w-11 place-items-center rounded-full bg-espresso text-white"
          >
            <Plus size={22} />
          </Link>
        }
      />
      <div className="px-4">
        <Segment
          options={[
            { id: "mine", label: `내 레시피 ${mine.length}` },
            { id: "ref", label: `참고 레시피 ${others.length}` },
          ]}
          value={tab}
          onChange={(t) => router.replace(t === "mine" ? "/recipes/?tab=mine" : "/recipes/")}
        />

        <label className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-card px-3">
          <Search size={18} className="text-sub" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름, 만든 사람, 드리퍼, 나라"
            className="w-full bg-transparent py-3 outline-none"
          />
        </label>

        <div className="mt-2 flex gap-1.5">
          {(["all", "HOT", "ICE"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={serve === s}
              onClick={() => setServe(s)}
              className={`rounded-full border px-3.5 py-1.5 text-sm ${serve === s ? "border-espresso bg-espresso text-white" : "border-line bg-card"}`}
            >
              {s === "all" ? "전체" : s} {count(base, s)}
            </button>
          ))}
        </div>

        <div className="mt-3">
          {tab === "mine" ? (
            shownMine.length ? (
              <div className="space-y-2">
                {shownMine.map((e) => (
                  <RecipeCard key={e.key} e={e} />
                ))}
              </div>
            ) : (
              <Empty
                title={query || serve !== "all" ? "찾는 레시피가 없어요" : "아직 내 레시피가 없어요"}
                desc={
                  query || serve !== "all"
                    ? undefined
                    : "참고 레시피에서 ‘내 레시피로 복사’하거나, 기록 화면의 브루잉 레시피에서 ‘내 레시피로 저장’하면 여기에 모여요."
                }
                action={
                  !query && (
                    <Link href="/recipes/" className="rounded-xl bg-espresso px-4 py-2.5 font-semibold text-white">
                      참고 레시피 보기
                    </Link>
                  )
                }
              />
            )
          ) : groups.length ? (
            <>
              <FolderList
                groups={groups}
                render={(e) => <RecipeCard key={e.key} e={e} />}
                defaultOpen={false}
                forceOpen={!!query || serve !== "all"}
                resetKey={tab}
              />
              <p className="mt-4 px-1 text-[11px] leading-relaxed text-sub">
                참고 레시피는 공개된 원문(대회 기록·바리스타·로스터리·장비 회사)에서 숫자를 옮기고 설명은 앱에서 요약한 거예요. 레시피마다 출처와 확인 한계를
                적어 두었어요. 2026년 11월 조사.
              </p>
            </>
          ) : (
            <Empty title="찾는 레시피가 없어요" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Recipes />
    </Suspense>
  );
}
