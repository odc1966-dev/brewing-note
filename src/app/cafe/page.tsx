"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Share2 } from "lucide-react";
import { remove, useStore } from "@/lib/store";
import { drawCafeCard } from "@/lib/card";
import { fmtDate } from "@/lib/util";
import { Card, ConfirmDelete, Empty, Header, PrimaryButton, Section, Stars } from "@/components/ui";
import { CafeItem, TagRow } from "@/components/Items";
import Radar from "@/components/Radar";
import ShareSheet from "@/components/ShareSheet";
import { PhotoStrip } from "@/components/Photos";

function View() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const cafes = useStore((s) => s.cafes);
  const nickname = useStore((s) => s.settings.nickname);
  const [share, setShare] = useState(false);

  const log = cafes.find((c) => c.id === id);
  const sameCafe = useMemo(
    () => (log?.cafe ? cafes.filter((c) => c.cafe === log.cafe && c.id !== log.id).sort((a, b) => b.date.localeCompare(a.date)) : []),
    [cafes, log],
  );
  const draw = useCallback((c: HTMLCanvasElement, photo?: HTMLImageElement | null) => log && drawCafeCard(c, log, nickname, photo), [log, nickname]);

  if (!log)
    return (
      <div>
        <Header title="카페 기록" back />
        <div className="px-4">
          <Empty title="기록을 찾을 수 없어요" />
        </div>
      </div>
    );

  return (
    <div>
      <Header
        title={fmtDate(log.date)}
        back
        right={
          <Link href={`/cafe/edit/?id=${log.id}`} aria-label="수정" className="grid h-11 w-11 place-items-center rounded-full active:bg-cream">
            <Pencil size={20} />
          </Link>
        }
      />
      <div className="px-4">
        <Card className="text-center">
          <div className="text-xs font-bold tracking-wide text-accent">CAFE</div>
          <div className="mt-1 text-xl font-extrabold">{log.menu || "메뉴"}</div>
          <div className="mt-0.5 text-sm text-sub">{log.cafe}</div>
          {(log.beanInfo || log.price != null) && (
            <div className="mt-1 text-sm text-sub">
              {[log.beanInfo, log.price != null ? `${log.price.toLocaleString()}원` : ""].filter(Boolean).join(" · ")}
            </div>
          )}
          {log.rating > 0 && (
            <div className="mt-2 flex justify-center">
              <Stars value={log.rating} size={20} />
            </div>
          )}
        </Card>

        {log.photos?.length ? (
          <div className="mt-4">
            <PhotoStrip ids={log.photos} />
          </div>
        ) : null}

        <Section title="플레이버 프로필">
          <Card>
            <Radar flavor={log.flavor} size={260} />
            <div className="mt-3 flex justify-center">
              <TagRow tags={log.tags} />
            </div>
          </Card>
        </Section>

        {log.memo && (
          <Section title="메모">
            <Card className="whitespace-pre-wrap text-[15px] leading-relaxed">{log.memo}</Card>
          </Section>
        )}

        <PrimaryButton className="mt-6" onClick={() => setShare(true)}>
          <Share2 size={20} /> 카드로 공유
        </PrimaryButton>

        {sameCafe.length > 0 && (
          <Section title={`${log.cafe}의 다른 기록`}>
            <div className="space-y-2">
              {sameCafe.slice(0, 10).map((c) => (
                <CafeItem key={c.id} log={c} />
              ))}
            </div>
          </Section>
        )}

        <div className="mt-8">
          <ConfirmDelete
            label="이 기록 삭제"
            onConfirm={async () => {
              await remove("cafes", log.id);
              router.replace("/records/?tab=cafe");
            }}
          />
        </div>
      </div>
      <ShareSheet open={share} onClose={() => setShare(false)} draw={draw} fileName={`brewing-note-cafe-${log.date}.png`} photoId={log.photos?.[0]} />
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
