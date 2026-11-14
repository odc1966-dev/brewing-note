"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookmarkPlus, Coffee, ExternalLink, Info, Pencil, Snowflake } from "lucide-react";
import { saveSettings, useStore } from "@/lib/store";
import { findEntry, kindLabel, toSaved } from "@/lib/recipeLib";
import { groupLabel, ratioOf } from "@/lib/refRecipes";
import { Card, ConfirmDelete, Empty, GhostButton, Header, PrimaryButton, Section } from "@/components/ui";
import RecipeView from "@/components/RecipeView";
import { BrewItem } from "@/components/Items";
import { PhotoStrip } from "@/components/Photos";

function View() {
  const router = useRouter();
  const key = useSearchParams().get("id");
  const settings = useStore((s) => s.settings);
  const brews = useStore((s) => s.brews);
  const beans = useStore((s) => s.beans);
  const [copied, setCopied] = useState<string | null>(null);

  const e = useMemo(() => findEntry(settings, key), [settings, key]);
  const used = useMemo(
    () => brews.filter((b) => b.refId === key).sort((a, z) => z.date.localeCompare(a.date) || z.createdAt - a.createdAt),
    [brews, key],
  );
  const beanMap = useMemo(() => new Map(beans.map((b) => [b.id, b])), [beans]);

  if (!e)
    return (
      <div>
        <Header title="레시피" back />
        <div className="px-4">
          <Empty title="레시피를 찾을 수 없어요" />
        </div>
      </div>
    );

  const r = e.r;
  const cells: [string, string][] = [
    ["원두", r.dose != null ? `${r.dose}g` : "–"],
    [r.serve === "ICE" ? "뜨거운 물" : "물", r.water != null ? `${r.water}g` : "–"],
    ...(r.serve === "ICE" ? ([["얼음", r.ice ? `${r.ice}g` : "–"]] as [string, string][]) : []),
    ["수온", r.temp != null ? `${r.temp}°C` : "–"],
    [r.ice ? "비율(얼음 포함)" : "비율", ratioOf(r)],
    ["총 시간", r.total || "–"],
  ];
  const grindParts: [string, string | undefined][] = [
    ["그라인더", r.grind.grinder],
    ["설정", r.grind.setting],
    ["굵기", r.grind.desc],
  ];
  const hasGrind = grindParts.some((g) => g[1]);

  async function copyToMine() {
    const s = toSaved(e!);
    await saveSettings({ recipes: [...(settings.recipes ?? []), s] });
    setCopied("my:" + s.id);
  }

  async function removeIt() {
    if (e!.kind === "my") await saveSettings({ recipes: (settings.recipes ?? []).filter((x) => x.id !== e!.saved?.id) });
    else if (e!.kind === "c") await saveSettings({ customRefs: (settings.customRefs ?? []).filter((x) => x.id !== r.id) });
    router.replace(e!.kind === "my" ? "/recipes/?tab=mine" : "/recipes/");
  }

  return (
    <div>
      <Header
        title={r.name}
        back
        right={
          e.kind !== "ref" && (
            <Link
              href={`/recipes/edit/?id=${encodeURIComponent(e.key)}`}
              aria-label="고치기"
              className="grid h-11 w-11 place-items-center rounded-full active:bg-cream"
            >
              <Pencil size={20} />
            </Link>
          )
        }
      />
      <div className="px-4">
        <Card className="text-center">
          <div className="flex flex-wrap justify-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                r.serve === "ICE" ? "bg-sky-100 text-sky-800" : "bg-accent-soft text-accent"
              }`}
            >
              {r.serve === "ICE" && <Snowflake size={12} />}
              {r.serve}
            </span>
            <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-semibold">
              {e.kind === "my" ? kindLabel("my") : groupLabel(r.group)}
            </span>
          </div>
          <div className="mt-2 font-display text-xl font-extrabold">{r.name}</div>
          <div className="mt-0.5 text-sm text-sub">
            {[r.author, r.year, r.country].filter(Boolean).join(" · ")}
          </div>
          <div className="mt-0.5 text-sm text-sub">{r.brewer}</div>
        </Card>

        <Section title="추출 변수">
          <div className="grid grid-cols-3 gap-2">
            {cells.map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line bg-card px-2 py-2.5 text-center">
                <div className="text-[11px] text-sub">{k}</div>
                <div className="truncate text-[17px] font-bold">{v}</div>
              </div>
            ))}
          </div>
          {r.tempNote && <p className="mt-2 px-1 text-xs text-sub">수온: {r.tempNote}</p>}
        </Section>

        <Section title="분쇄도">
          <Card className="!py-3">
            {hasGrind ? (
              <dl className="grid grid-cols-[64px_1fr] gap-y-1 text-sm">
                {grindParts
                  .filter((g) => g[1])
                  .map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-sub">{k}</dt>
                      <dd className="font-semibold">{v}</dd>
                    </div>
                  ))}
              </dl>
            ) : (
              <p className="text-sm text-sub">원문에 분쇄도가 없어요.</p>
            )}
            {r.grind.grinder && (
              <p className="mt-2 text-[11px] leading-snug text-sub">
                그라인더마다 숫자의 굵기가 달라요. 내 그라인더에서는 ‘굵기’ 설명과 총 시간을 기준으로 맞춰 보세요.
              </p>
            )}
          </Card>
        </Section>

        {r.bean && r.bean !== "–" && (
          <Section title="추천 원두 성향">
            <Card className="!py-3 text-[15px]">{r.bean}</Card>
          </Section>
        )}

        {r.intent && (
          <Section title={e.kind === "my" ? "내 메모" : "만든 사람의 설명·의도"}>
            <Card className="!py-3 whitespace-pre-wrap text-[15px] leading-relaxed">{r.intent}</Card>
          </Section>
        )}

        <Section title={`단계 ${r.steps.length}`}>
          {r.steps.length ? <RecipeView steps={r.steps} /> : <Empty title="단계가 없어요" />}
        </Section>

        {r.photos?.length ? (
          <Section title="사진">
            <PhotoStrip ids={r.photos} />
          </Section>
        ) : null}

        {r.note && (
          <div className="mt-4 flex gap-2 rounded-2xl bg-cream px-3.5 py-3 text-[13px] leading-snug">
            <Info size={16} className="mt-0.5 shrink-0 text-sub" />
            <span>{r.note}</span>
          </div>
        )}

        {r.sources.length > 0 && (
          <Section title="출처">
            <div className="space-y-1.5">
              {r.sources.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-2.5 text-sm active:bg-cream"
                >
                  <ExternalLink size={15} className="shrink-0 text-sub" />
                  <span className="min-w-0 flex-1 truncate">{s.label}</span>
                </a>
              ))}
            </div>
          </Section>
        )}

        <div className="mt-6 space-y-2">
          <PrimaryButton onClick={() => router.push(`/brew/edit/?ref=${encodeURIComponent(e.key)}`)}>
            <Coffee size={20} /> 이 레시피로 내리기
          </PrimaryButton>
          {e.kind !== "my" &&
            (copied ? (
              <Link
                href={`/recipes/view/?id=${encodeURIComponent(copied)}`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-soft py-3.5 text-[15px] font-semibold text-accent"
              >
                내 레시피에 복사했어요 · 보러 가기 ›
              </Link>
            ) : (
              <GhostButton className="w-full" onClick={copyToMine}>
                <BookmarkPlus size={18} /> 내 레시피로 복사
              </GhostButton>
            ))}
          <p className="px-1 text-center text-[11px] text-sub">원두량은 레시피 그대로 가져와요.</p>
        </div>

        {used.length > 0 && (
          <Section title={`이 레시피로 내린 기록 ${used.length}`}>
            <div className="space-y-2">
              {used.map((b) => (
                <BrewItem key={b.id} brew={b} bean={beanMap.get(b.beanId)} />
              ))}
            </div>
          </Section>
        )}

        {e.kind !== "ref" && (
          <div className="mt-8">
            <ConfirmDelete label={e.kind === "my" ? "내 레시피 삭제" : "이 레시피 삭제"} onConfirm={removeIt} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
