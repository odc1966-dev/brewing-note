"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { remove, upsert, useStore } from "@/lib/store";
import { PROCESSES, ROASTS } from "@/lib/constants";
import type { Bean } from "@/lib/types";
import { ChipSelect, ConfirmDelete, Header, Label, NumBox, PrimaryButton, Section, TextArea, TextInput } from "@/components/ui";
import { BrewItem, FreshBadge, StockBar } from "@/components/Items";
import { adjustFor, stockOf } from "@/lib/stock";
import { num } from "@/lib/util";
import { newBean } from "@/components/BeanQuickAdd";
import CupNotePicker from "@/components/CupNotePicker";

function Editor() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const beans = useStore((s) => s.beans);
  const brews = useStore((s) => s.brews);
  const existing = beans.find((b) => b.id === id);
  const [b, setB] = useState<Bean>(() => (existing ? { ...existing } : newBean()));
  const patch = (p: Partial<Bean>) => setB((x) => ({ ...x, ...p }));
  const [weight, setWeight] = useState(existing?.weight ? String(existing.weight) : "");
  const [fix, setFix] = useState(""); // 남은 양 직접 맞추기
  const draft: Bean = { ...b, weight: num(weight) };
  const stock = stockOf(draft, brews);

  const history = useMemo(
    () => brews.filter((x) => x.beanId === b.id).sort((a, z) => z.date.localeCompare(a.date) || z.createdAt - a.createdAt),
    [brews, b.id],
  );
  const best = history.reduce<(typeof history)[number] | undefined>((m, x) => (x.rating > (m?.rating ?? 0) ? x : m), undefined);

  async function save() {
    const w = num(weight);
    const f = num(fix);
    const stockAdjust = w && f !== null ? adjustFor({ ...b, weight: w }, brews, f) : w ? (b.stockAdjust ?? 0) : 0;
    await upsert("beans", {
      ...b,
      name: b.name.trim(),
      roaster: b.roaster.trim(),
      origin: b.origin.trim(),
      notes: b.notes.trim(),
      weight: w,
      stockAdjust,
    });
    router.back();
  }

  return (
    <div>
      <Header title={existing ? "원두 정보" : "원두 등록"} back />
      <div className="px-4">
        <Label>원두 이름</Label>
        <TextInput value={b.name} onChange={(e) => patch({ name: e.target.value })} placeholder="예: Ethiopia Yirgacheffe G1" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>로스터리</Label>
            <TextInput value={b.roaster} onChange={(e) => patch({ roaster: e.target.value })} />
          </div>
          <div>
            <Label>원산지</Label>
            <TextInput value={b.origin} onChange={(e) => patch({ origin: e.target.value })} placeholder="Ethiopia" />
          </div>
        </div>

        <Label>로스팅 날짜</Label>
        <div className="flex items-center gap-2">
          <TextInput type="date" value={b.roastDate} onChange={(e) => patch({ roastDate: e.target.value })} className="flex-1" />
          <FreshBadge roastDate={b.roastDate} />
        </div>

        <Label>가공 방식</Label>
        <ChipSelect options={PROCESSES} value={b.process} onChange={(v) => patch({ process: v })} />
        <Label>로스팅 단계</Label>
        <ChipSelect options={ROASTS} value={b.roast} onChange={(v) => patch({ roast: v })} />

        <Label hint="넣으면 내릴 때마다 자동으로 빠져요">구입 용량 · 재고</Label>
        <div className="rounded-2xl border border-line bg-card p-3">
          <div className="grid grid-cols-2 gap-2">
            <NumBox label="구입 용량" unit="g" value={weight} onChange={setWeight} placeholder="200" inputMode="numeric" />
            <NumBox
              label="지금 남은 양 (직접 맞추기)"
              unit="g"
              value={fix}
              onChange={setFix}
              placeholder={stock ? String(stock.remaining) : "–"}
              inputMode="decimal"
            />
          </div>
          {stock && (
            <div className="mt-3">
              <StockBar stock={num(fix) !== null ? stockOf({ ...draft, stockAdjust: adjustFor(draft, brews, num(fix)!) }, brews)! : stock} />
              <p className="mt-1.5 text-xs text-sub">
                기록 {history.filter((h) => h.dose).length}잔에서 {stock.used}g 사용
                {stock.avgDose ? ` · 최근 평균 ${stock.avgDose.toFixed(1)}g/잔` : ""}
              </p>
            </div>
          )}
          {stock?.empty && !b.archived && (
            <button type="button" onClick={() => patch({ archived: true })} className="mt-2 w-full rounded-xl bg-cream py-2.5 text-sm font-semibold">
              다 마신 원두로 표시하기
            </button>
          )}
        </div>

        <Label hint="봉투에 적힌 노트">컵노트</Label>
        <CupNotePicker value={b.cupNotes ?? []} onChange={(cupNotes) => patch({ cupNotes })} />

        <Label hint="선택">메모</Label>
        <TextArea value={b.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder="구입처, 가격, 로스터리 설명 등" rows={2} />

        <label className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-card px-4 py-3.5">
          <input type="checkbox" checked={b.archived} onChange={(e) => patch({ archived: e.target.checked })} className="h-5 w-5 accent-[#3a2a20]" />
          <span>
            <span className="font-semibold">다 마신 원두</span>
            <span className="block text-xs text-sub">기록할 때 원두 목록에서 숨겨져요(기록은 그대로).</span>
          </span>
        </label>

        <PrimaryButton className="mt-6" onClick={save} disabled={!b.name.trim()}>
          저장
        </PrimaryButton>

        {history.length > 0 && (
          <Section title={`이 원두로 내린 기록 ${history.length}`}>
            {best && history.length > 1 && (
              <div className="mb-3">
                <p className="mb-1.5 px-1 text-xs font-semibold text-accent">가장 맛있었던 레시피</p>
                <BrewItem brew={best} bean={b} />
              </div>
            )}
            <div className="space-y-2">
              {history.map((x) => (
                <BrewItem key={x.id} brew={x} bean={b} />
              ))}
            </div>
          </Section>
        )}

        {existing && (
          <div className="mt-8">
            <ConfirmDelete
              label={history.length ? `원두 삭제 (기록 ${history.length}개는 '원두 미지정'으로 남음)` : "원두 삭제"}
              onConfirm={async () => {
                await remove("beans", existing.id);
                router.replace("/beans/");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Editor />
    </Suspense>
  );
}
