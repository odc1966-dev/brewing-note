"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Archive, Copy, PackageOpen, Pencil, Share2 } from "lucide-react";
import { stockOf } from "@/lib/stock";
import { archiveBean } from "@/lib/archive";
import { remove, useStore } from "@/lib/store";
import { gearKindLabel } from "@/lib/constants";
import { drawBrewCard } from "@/lib/card";
import { fmtDate, fmtTime, mmss, ratio } from "@/lib/util";
import { Card, ConfirmDelete, Empty, GhostButton, Header, PrimaryButton, Section, Stars } from "@/components/ui";
import { BrewItem, FreshBadge, TagRow } from "@/components/Items";
import Radar from "@/components/Radar";
import ShareSheet from "@/components/ShareSheet";
import { PhotoStrip } from "@/components/Photos";
import RecipeView from "@/components/RecipeView";

function View() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const brews = useStore((s) => s.brews);
  const beans = useStore((s) => s.beans);
  const gear = useStore((s) => s.gear);
  const nickname = useStore((s) => s.settings.nickname);
  const [share, setShare] = useState(false);
  const [compareOn, setCompareOn] = useState(true);

  const brew = brews.find((x) => x.id === id);
  const bean = beans.find((x) => x.id === brew?.beanId);
  const beanStock = bean ? stockOf(bean, brews) : null;

  const sameBean = useMemo(
    () =>
      brew?.beanId
        ? brews
            .filter((x) => x.beanId === brew.beanId && x.id !== brew.id)
            .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
        : [],
    [brews, brew],
  );
  // 이 기록보다 앞선 같은 원두 기록 중 가장 최근 것
  const prev = brew ? sameBean.find((x) => x.date < brew.date || (x.date === brew.date && x.createdAt < brew.createdAt)) : undefined;

  const draw = useCallback(
    (c: HTMLCanvasElement, photo?: HTMLImageElement | null) => brew && drawBrewCard(c, brew, bean, gear, nickname, photo),
    [brew, bean, gear, nickname],
  );

  if (!brew)
    return (
      <div>
        <Header title="기록" back />
        <div className="px-4">
          <Empty title="기록을 찾을 수 없어요" />
        </div>
      </div>
    );

  const used = gear.filter((g) => brew.gearIds.includes(g.id));
  const cells: [string, string][] = [
    ["원두", brew.dose != null ? `${brew.dose}g` : "–"],
    [brew.method === "에스프레소" ? "추출량" : "물", brew.water != null ? `${brew.water}g` : "–"],
    ["수온", brew.temp != null ? `${brew.temp}°C` : "–"],
    ["분쇄도", brew.grind || "–"],
    ["시간", brew.time != null ? fmtTime(brew.time) : "–"],
    ["물 종류", brew.waterType || "–"],
  ];
  const showPrev = prev && compareOn;

  return (
    <div>
      <Header
        title={fmtDate(brew.date)}
        back
        right={
          <Link href={`/brew/edit/?id=${brew.id}`} aria-label="수정" className="grid h-11 w-11 place-items-center rounded-full active:bg-cream">
            <Pencil size={20} />
          </Link>
        }
      />
      <div className="px-4">
        <Card className="text-center">
          <div className="text-xs font-bold tracking-wide text-accent">{brew.method}</div>
          <div className="mt-1 text-xl font-extrabold">{bean?.name || "원두 미지정"}</div>
          <div className="mt-0.5 text-sm text-sub">{[bean?.roaster, bean?.origin, bean?.process, bean?.roast].filter(Boolean).join(" · ")}</div>
          {bean?.roastDate && (
            <div className="mt-2">
              <FreshBadge roastDate={bean.roastDate} />
            </div>
          )}
          {brew.rating > 0 && (
            <div className="mt-2 flex justify-center">
              <Stars value={brew.rating} size={20} />
            </div>
          )}
        </Card>

        {bean && !bean.archived && beanStock?.empty && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-orange-50 px-4 py-3 text-orange-900">
            <PackageOpen size={20} className="shrink-0" />
            <span className="min-w-0 flex-1 text-sm">
              <b>{bean.name}</b> 원두를 다 썼어요.
            </span>
            <button
              onClick={() => archiveBean(bean)}
              className="flex shrink-0 items-center gap-1 rounded-xl bg-espresso px-3 py-2 text-sm font-semibold text-white"
            >
              <Archive size={15} /> 보관함으로
            </button>
          </div>
        )}
        {brew.photos?.length ? (
          <div className="mt-4">
            <PhotoStrip ids={brew.photos} />
          </div>
        ) : null}

        <Section title="추출 변수" action={ratio(brew.dose, brew.water) && <span className="text-sm font-semibold text-accent">비율 {ratio(brew.dose, brew.water)}</span>}>
          <div className="grid grid-cols-3 gap-2">
            {cells.map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line bg-card px-3 py-2.5 text-center">
                <div className="text-[11px] text-sub">{k}</div>
                <div className="truncate text-lg font-bold">{v}</div>
              </div>
            ))}
          </div>
          {brew.pours?.length ? (
            <p className="mt-2 px-1 text-xs text-sub">푸어 시각: {brew.pours.map(mmss).join(" · ")}</p>
          ) : null}
          {used.length > 0 && (
            <p className="mt-2 px-1 text-xs text-sub">{used.map((g) => `${gearKindLabel(g.kind)} ${g.name}`).join(" · ")}</p>
          )}
        </Section>

        {brew.recipe?.length ? (
          <Section title="브루잉 레시피">
            <RecipeView steps={brew.recipe} actual={brew.recipeActual} />
          </Section>
        ) : null}

        <Section
          title="플레이버 프로필"
          action={
            prev && (
              <button onClick={() => setCompareOn((v) => !v)} className="text-sm text-accent">
                {compareOn ? "비교 끄기" : "이전 기록과 비교"}
              </button>
            )
          }
        >
          <Card>
            <Radar flavor={brew.flavor} compare={showPrev ? prev.flavor : undefined} size={260} />
            {showPrev && (
              <p className="mt-1 text-center text-xs text-sub">
                점선 = 같은 원두 이전 기록 ({fmtDate(prev.date)}
                {prev.grind && prev.grind !== brew.grind ? `, 분쇄 ${prev.grind}` : ""}
                {prev.temp != null && prev.temp !== brew.temp ? `, ${prev.temp}°C` : ""})
              </p>
            )}
            <div className="mt-3 flex justify-center">
              <TagRow tags={brew.tags} />
            </div>
          </Card>
        </Section>

        {brew.memo && (
          <Section title="메모">
            <Card className="whitespace-pre-wrap text-[15px] leading-relaxed">{brew.memo}</Card>
          </Section>
        )}

        <div className="mt-6 space-y-2">
          <PrimaryButton onClick={() => setShare(true)}>
            <Share2 size={20} /> 레시피 카드 공유
          </PrimaryButton>
          <GhostButton className="w-full" onClick={() => router.push(`/brew/edit/?copy=${brew.id}`)}>
            <Copy size={18} /> 이 레시피로 다시 내리기
          </GhostButton>
        </div>

        {sameBean.length > 0 && (
          <Section title={`같은 원두로 내린 기록 ${sameBean.length}`}>
            <div className="space-y-2">
              {sameBean.slice(0, 10).map((x) => (
                <BrewItem key={x.id} brew={x} bean={bean} />
              ))}
            </div>
          </Section>
        )}

        <div className="mt-8">
          <ConfirmDelete
            label="이 기록 삭제"
            onConfirm={async () => {
              await remove("brews", brew.id);
              router.replace("/records/");
            }}
          />
        </div>
      </div>

      <ShareSheet open={share} onClose={() => setShare(false)} draw={draw} fileName={`brewing-note-${brew.date}.png`} photoId={brew.photos?.[0]} />
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
