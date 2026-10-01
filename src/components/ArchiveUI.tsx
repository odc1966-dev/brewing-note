"use client";

import Link from "next/link";
import { Archive, ChevronRight, Star } from "lucide-react";
import type { Bean } from "@/lib/types";
import type { BeanSummary } from "@/lib/archive";
import { fmtDate } from "@/lib/util";
import { TagChip, GhostButton, Modal, PrimaryButton } from "./ui";

const shortDate = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
};

/** 보관함 목록 한 줄: 원두 정보 + 몇 잔·평균 별점·가장 맛있던 레시피 */
export function ArchiveItem({ bean, summary }: { bean: Bean; summary: BeanSummary }) {
  const best = summary.best;
  return (
    <Link href={`/beans/edit/?id=${bean.id}`} className="block rounded-2xl border border-line bg-card px-4 py-3.5 active:bg-cream">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-semibold">{bean.name}</span>
        {summary.avgRating !== null && (
          <span className="flex items-center gap-0.5 text-sm font-semibold text-[#b7791f]">
            <Star size={14} fill="currentColor" strokeWidth={0} />
            {summary.avgRating.toFixed(1)}
          </span>
        )}
        <ChevronRight size={18} className="text-sub" />
      </div>
      <div className="mt-0.5 truncate text-xs text-sub">
        {[bean.roaster, bean.origin, bean.process].filter(Boolean).join(" · ") || "로스터리 정보 없음"}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="rounded-full bg-cream px-2 py-0.5 font-semibold">{summary.cups}잔</span>
        {summary.firstDate && summary.lastDate && (
          <span className="rounded-full bg-cream px-2 py-0.5">
            {summary.firstDate === summary.lastDate ? fmtDate(summary.firstDate) : `${summary.firstDate.slice(5).replace("-", ".")} ~ ${summary.lastDate.slice(5).replace("-", ".")}`}
          </span>
        )}
        {bean.archivedAt && <span className="rounded-full bg-stone-200 px-2 py-0.5">{shortDate(bean.archivedAt)} 보관</span>}
        {(bean.cupNotes ?? []).slice(0, 3).map((t) => (
          <TagChip key={t} id={t} small />
        ))}
      </div>
      {best && (
        <div className="mt-2 rounded-xl bg-bg px-3 py-2 text-xs">
          <span className="font-semibold text-accent">베스트 레시피</span>{" "}
          {[best.method, best.dose && best.water ? `${best.dose}g · ${best.water}g` : "", best.grind, best.temp ? `${best.temp}°C` : ""]
            .filter(Boolean)
            .join(" · ")}{" "}
          <span className="text-[#b7791f]">★{best.rating}</span>
        </div>
      )}
    </Link>
  );
}

/** 다시 꺼낼 때: 재고를 새로 채울지 묻는다(같은 원두를 다시 샀을 때) */
export function RestoreSheet({
  bean,
  open,
  onClose,
  onRestore,
}: {
  bean: Bean;
  open: boolean;
  onClose: () => void;
  onRestore: (refill: boolean) => void;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-cream text-espresso">
          <Archive size={22} />
        </span>
        <h2 className="mt-2 text-[17px] font-bold">{bean.name} 다시 꺼내기</h2>
        <p className="mt-1 text-sm text-sub">원두 목록으로 돌아가고, 기록할 때 다시 고를 수 있어요.</p>
      </div>
      <div className="mt-4 space-y-2">
        {bean.weight ? (
          <>
            <PrimaryButton onClick={() => onRestore(true)}>새로 샀어요 · 재고 {bean.weight}g으로 채우기</PrimaryButton>
            <GhostButton className="w-full" onClick={() => onRestore(false)}>
              재고는 그대로 두고 꺼내기
            </GhostButton>
          </>
        ) : (
          <PrimaryButton onClick={() => onRestore(false)}>다시 꺼내기</PrimaryButton>
        )}
        <button onClick={onClose} className="w-full py-2.5 text-sm text-sub">
          취소
        </button>
      </div>
    </Modal>
  );
}
