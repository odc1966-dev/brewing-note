"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { upsert, useStore } from "@/lib/store";
import { EMPTY_FLAVOR } from "@/lib/constants";
import type { CafeLog } from "@/lib/types";
import { num, today, uid } from "@/lib/util";
import { Header, Label, PrimaryButton, Stars, TextArea, TextInput } from "@/components/ui";
import Radar, { FlavorRows } from "@/components/Radar";
import CupNotePicker from "@/components/CupNotePicker";
import { PhotoPicker, useDraftPhotos } from "@/components/Photos";

function Editor() {
  const router = useRouter();
  const editId = useSearchParams().get("id");
  const cafes = useStore((s) => s.cafes);

  const [init] = useState<CafeLog>(() => {
    const src = cafes.find((c) => c.id === editId);
    if (src) return { ...src };
    const now = Date.now();
    return {
      id: uid(),
      date: today(),
      cafe: "",
      menu: "",
      beanInfo: "",
      price: null,
      flavor: { ...EMPTY_FLAVOR },
      tags: [],
      rating: 0,
      memo: "",
      createdAt: now,
      updatedAt: now,
    };
  });
  const [c, setC] = useState(init);
  const [price, setPrice] = useState(init.price?.toString() ?? "");
  const patch = (p: Partial<CafeLog>) => setC((x) => ({ ...x, ...p }));
  const [photos, setPhotos, commitPhotos] = useDraftPhotos(init.photos ?? []);

  // 전에 적은 카페 이름을 다시 고를 수 있게
  const knownCafes = useMemo(() => [...new Set(cafes.map((x) => x.cafe).filter(Boolean))].slice(0, 30), [cafes]);

  async function save() {
    const out: CafeLog = {
      ...c,
      cafe: c.cafe.trim(),
      menu: c.menu.trim(),
      beanInfo: c.beanInfo.trim(),
      memo: c.memo.trim(),
      price: num(price.replace(/,/g, "")),
      photos,
      updatedAt: Date.now(),
    };
    await upsert("cafes", out);
    commitPhotos();
    router.replace(`/cafe/?id=${out.id}`);
  }

  return (
    <div>
      <Header title={editId ? "카페 기록 수정" : "카페 기록"} back />
      <div className="px-4">
        <Label>카페 이름</Label>
        <TextInput list="known-cafes" value={c.cafe} onChange={(e) => patch({ cafe: e.target.value })} placeholder="예: 골목 카페" />
        <datalist id="known-cafes">
          {knownCafes.map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>

        <Label>메뉴</Label>
        <TextInput value={c.menu} onChange={(e) => patch({ menu: e.target.value })} placeholder="예: 필터 커피, 플랫화이트" />

        <div className="grid grid-cols-[2fr_1fr] gap-2">
          <div>
            <Label hint="선택">원두 정보</Label>
            <TextInput value={c.beanInfo} onChange={(e) => patch({ beanInfo: e.target.value })} placeholder="예: 케냐 AA" />
          </div>
          <div>
            <Label hint="원">가격</Label>
            <TextInput inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="6000" />
          </div>
        </div>

        <Label hint="차트를 누르거나 끌어도 돼요">플레이버 프로필</Label>
        <div className="rounded-2xl border border-line bg-card p-3">
          <Radar flavor={c.flavor} onChange={(f) => patch({ flavor: f })} size={260} />
          <FlavorRows flavor={c.flavor} onChange={(f) => patch({ flavor: f })} />
        </div>

        <Label hint="플레이버 휠 용어">컵노트</Label>
        <CupNotePicker value={c.tags} onChange={(tags) => patch({ tags })} />

        <Label hint="별 왼쪽 절반 = 0.5점">별점</Label>
        <Stars value={c.rating} onChange={(rating) => patch({ rating })} size={34} />

        <Label hint="최대 3장">사진</Label>
        <PhotoPicker value={photos} onChange={setPhotos} />

        <Label>메모</Label>
        <TextArea value={c.memo} onChange={(e) => patch({ memo: e.target.value })} placeholder="분위기, 맛, 다시 갈지" />

        <Label>날짜</Label>
        <TextInput type="date" value={c.date} onChange={(e) => patch({ date: e.target.value || today() })} />

        <PrimaryButton className="mt-6" onClick={save} disabled={!c.cafe.trim() && !c.menu.trim()}>
          저장
        </PrimaryButton>
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
