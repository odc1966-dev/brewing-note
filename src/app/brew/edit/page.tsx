"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Timer } from "lucide-react";
import { upsert, useStore } from "@/lib/store";
import { EMPTY_FLAVOR, METHODS, tagLabel } from "@/lib/constants";
import type { Brew, RecipeStep } from "@/lib/types";
import { fmtTime, mmss, num, parseTime, ratio, today, uid } from "@/lib/util";
import { ChipSelect, Header, Label, NumBox, PrimaryButton, Stars, TextArea, TextInput } from "@/components/ui";
import Radar, { FlavorRows } from "@/components/Radar";
import CupNotePicker from "@/components/CupNotePicker";
import BeanQuickAdd from "@/components/BeanQuickAdd";
import { FreshBadge, StockBar } from "@/components/Items";
import { PhotoPicker, useDraftPhotos } from "@/components/Photos";
import BrewTimer from "@/components/BrewTimer";
import GearPicker from "@/components/GearPicker";
import RecipeEditor from "@/components/RecipeEditor";
import { cloneSteps } from "@/lib/recipe";
import { stockOf } from "@/lib/stock";

function Editor() {
  const router = useRouter();
  const sp = useSearchParams();
  const editId = sp.get("id");
  const copyId = sp.get("copy");

  const brews = useStore((s) => s.brews);
  const beans = useStore((s) => s.beans);
  const gear = useStore((s) => s.gear);
  const settings = useStore((s) => s.settings);

  // 처음 한 번만 초기값을 만든다(편집 / 복제 / 새 기록)
  const [init] = useState(() => {
    const src = brews.find((b) => b.id === (editId || copyId));
    if (src && editId) return { ...src };
    const last = [...brews].sort((a, b) => b.createdAt - a.createdAt)[0];
    const base = src ?? null;
    const now = Date.now();
    return {
      id: uid(),
      date: today(),
      // 직전 원두가 보관함에 들어갔으면 미리 고르지 않는다
      beanId: base?.beanId ?? (last && !beans.find((x) => x.id === last.beanId)?.archived ? last.beanId : ""),
      method: base?.method ?? last?.method ?? settings.defaultMethod,
      gearIds: base?.gearIds ?? last?.gearIds ?? [],
      dose: base?.dose ?? null,
      water: base?.water ?? null,
      temp: base?.temp ?? settings.defaultTemp,
      grind: base?.grind ?? "",
      time: base?.time ?? null,
      waterType: base?.waterType ?? last?.waterType ?? "",
      recipe: base?.recipe,
      flavor: { ...EMPTY_FLAVOR },
      tags: [],
      rating: 0,
      memo: "",
      createdAt: now,
      updatedAt: now,
    } satisfies Brew;
  });

  const [b, setB] = useState<Brew>(init);
  const [dose, setDose] = useState(init.dose?.toString() ?? "");
  const [water, setWater] = useState(init.water?.toString() ?? "");
  const [temp, setTemp] = useState(init.temp?.toString() ?? "");
  const [time, setTime] = useState(init.time != null ? fmtTime(init.time).replace("초", "") : "");
  const [addBean, setAddBean] = useState(false);
  const [timer, setTimer] = useState(false);
  const [pours, setPours] = useState<number[]>(init.pours ?? []);
  const [recipe, setRecipe] = useState<RecipeStep[]>(() => (init.recipe ? (editId ? init.recipe : cloneSteps(init.recipe)) : []));
  const [actual, setActual] = useState<(number | null)[]>(editId ? init.recipeActual ?? [] : []);
  const [photos, setPhotos, commitPhotos] = useDraftPhotos(editId ? init.photos ?? [] : []);
  const [showArchived, setShowArchived] = useState(false);

  const patch = (p: Partial<Brew>) => setB((x) => ({ ...x, ...p }));

  const beanList = useMemo(
    () => beans.filter((x) => !x.archived || showArchived || x.id === b.beanId).sort((a, z) => z.createdAt - a.createdAt),
    [beans, showArchived, b.beanId],
  );
  const curBean = beans.find((x) => x.id === b.beanId);
  // 재고: 지금 편집 중인 이 기록의 원두량은 빼고 계산한 뒤 이번 원두량과 비교
  const stock = curBean ? stockOf(curBean, brews.filter((x) => x.id !== b.id)) : null;
  const short = stock && num(dose) ? num(dose)! > stock.remaining : false;
  const r = ratio(num(dose), num(water));
  const grinder = gear.find((g) => g.kind === "grinder" && b.gearIds.includes(g.id));

  async function save() {
    const out: Brew = {
      ...b,
      dose: num(dose),
      water: num(water),
      temp: num(temp),
      time: parseTime(time),
      grind: b.grind.trim(),
      memo: b.memo.trim(),
      gearIds: b.gearIds.filter((id) => gear.some((g) => g.id === id)), // 지운 장비는 빼고 저장
      photos,
      pours: pours.length && !recipe.length ? pours : undefined,
      recipe: recipe.length ? recipe : undefined,
      recipeActual: recipe.length && actual.some((a) => a !== null) ? actual : undefined,
      updatedAt: Date.now(),
    };
    await upsert("brews", out);
    commitPhotos();
    router.replace(`/brew/?id=${out.id}`);
  }

  const title = editId ? "기록 수정" : copyId ? "레시피 복제" : "오늘의 커피";

  return (
    <div>
      <Header title={title} back />
      <div className="px-4">
        {copyId && !editId && (
          <p className="mb-2 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">
            이전 레시피를 불러왔어요. 바꾸고 싶은 변수만 고쳐 보세요.
          </p>
        )}

        <Label>원두</Label>
        <div className="flex flex-wrap gap-2">
          {beanList.map((x) => {
            const on = x.id === b.beanId;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => patch({ beanId: on ? "" : x.id })}
                className={`max-w-full truncate rounded-full border px-3 py-2 text-sm ${on ? "border-espresso bg-espresso text-white" : "border-line bg-card"}`}
              >
                {x.name}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setAddBean(true)}
            className="flex items-center gap-1 rounded-full border border-dashed border-accent px-3 py-2 text-sm text-accent"
          >
            <Plus size={16} /> 새 원두
          </button>
        </div>
        {beans.some((x) => x.archived) && (
          <button type="button" onClick={() => setShowArchived((v) => !v)} className="mt-2 px-1 text-xs text-sub underline">
            {showArchived ? "보관함 원두 숨기기" : "보관함 원두도 보기"}
          </button>
        )}
        {curBean && (
          <div className="mt-2 flex items-center gap-2 px-1 text-xs text-sub">
            {[curBean.roaster, curBean.origin, curBean.process].filter(Boolean).join(" · ")}
            <FreshBadge roastDate={curBean.roastDate} />
          </div>
        )}
        {stock && (
          <div className="mt-2 px-1">
            <StockBar stock={stock} />
            {short && <p className="mt-1 text-xs font-semibold text-orange-700">이번 원두량이 남은 양({stock.remaining}g)보다 많아요. 원두 화면에서 남은 양을 맞춰 주세요.</p>}
          </div>
        )}

        <Label>추출 방식</Label>
        <ChipSelect options={METHODS} value={b.method} onChange={(v) => patch({ method: v })} allowEmpty={false} />

        <Label hint="종류마다 하나씩">사용한 장비</Label>
        <GearPicker value={b.gearIds.filter((id) => gear.some((g) => g.id === id))} onChange={(gearIds) => patch({ gearIds })} />

        <Label hint={r ? `비율 ${r}` : undefined}>추출 변수</Label>
        <div className="grid grid-cols-3 gap-2">
          <NumBox label="원두" unit="g" value={dose} onChange={setDose} placeholder="15" />
          <NumBox label={b.method === "에스프레소" ? "추출량" : "물"} unit="g" value={water} onChange={setWater} placeholder="240" />
          <NumBox label="수온" unit="°C" value={temp} onChange={setTemp} placeholder="92" />
          <NumBox label="분쇄도" value={b.grind} onChange={(v) => patch({ grind: v })} inputMode="text" placeholder="16클릭" />
          <NumBox label="시간 (분:초)" value={time} onChange={setTime} inputMode="text" placeholder="2:30" />
          <NumBox label="물 종류" value={b.waterType} onChange={(v) => patch({ waterType: v })} inputMode="text" placeholder="생수" />
        </div>
        {grinder?.memo && (
          <p className="mt-2 px-1 text-xs text-sub">
            {grinder.name}: {grinder.memo}
          </p>
        )}
        {pours.length > 0 && !recipe.length && (
          <p className="mt-2 px-1 text-xs text-sub">
            타이머 푸어 기록: {pours.map(mmss).join(" · ")}{" "}
            <button type="button" className="underline" onClick={() => setPours([])}>
              지우기
            </button>
          </p>
        )}

        <Label hint="뜸 들이기 · N차 푸어">브루잉 레시피</Label>
        <RecipeEditor
          steps={recipe}
          onChange={(st) => {
            setRecipe(st);
            setActual([]); // 레시피가 바뀌면 이전 실제 기록은 맞지 않으므로 지운다
          }}
          base={{ method: b.method, dose: num(dose), water: num(water), temp: num(temp), grind: b.grind.trim() }}
          onSetWater={(g) => setWater(String(g))}
          onLoad={(rc) => {
            setRecipe(cloneSteps(rc.steps));
            setActual([]);
            patch({ method: rc.method || b.method, grind: rc.grind || b.grind });
            if (rc.dose != null) setDose(String(rc.dose));
            if (rc.water != null) setWater(String(rc.water));
            if (rc.temp != null) setTemp(String(rc.temp));
          }}
        />
        {actual.some((a) => a !== null) && (
          <p className="mt-2 px-1 text-xs text-sub">
            타이머 실제 시작: {recipe.map((st, i) => `${st.label} ${actual[i] != null ? mmss(actual[i]!) : "–"}`).join(" · ")}
          </p>
        )}

        <button
          type="button"
          onClick={() => setTimer(true)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-espresso bg-card py-3.5 font-bold text-espresso active:bg-cream"
        >
          <Timer size={20} /> {recipe.length ? "이 레시피로 타이머 시작" : "타이머로 내리기"}
        </button>


        <Label hint="차트를 누르거나 끌어도 돼요">플레이버 프로필</Label>
        <div className="rounded-2xl border border-line bg-card p-3">
          <Radar flavor={b.flavor} onChange={(f) => patch({ flavor: f })} size={260} />
          <FlavorRows flavor={b.flavor} onChange={(f) => patch({ flavor: f })} />
        </div>

        <Label hint="플레이버 휠 용어">컵노트</Label>
        {curBean?.cupNotes?.length ? (
          <p className="mb-2 px-1 text-xs text-sub">로스터리 노트: {curBean.cupNotes.map(tagLabel).join(", ")} — 내가 느낀 것과 비교해 보세요</p>
        ) : null}
        <CupNotePicker value={b.tags} onChange={(tags) => patch({ tags })} />

        <Label hint="별 왼쪽 절반 = 0.5점">별점</Label>
        <Stars value={b.rating} onChange={(rating) => patch({ rating })} size={34} />

        <Label hint="최대 3장">사진</Label>
        <PhotoPicker value={photos} onChange={setPhotos} />

        <Label>메모</Label>
        <TextArea value={b.memo} onChange={(e) => patch({ memo: e.target.value })} placeholder="맛, 바꿔 볼 점, 기억할 것" />

        <Label>날짜</Label>
        <TextInput type="date" value={b.date} onChange={(e) => patch({ date: e.target.value || today() })} />

        <PrimaryButton className="mt-6" onClick={save}>
          저장
        </PrimaryButton>
      </div>

      <BrewTimer
        open={timer}
        onClose={() => setTimer(false)}
        dose={num(dose)}
        water={num(water)}
        guide={b.method === "핸드드립" || recipe.length > 0}
        recipe={recipe}
        onFinish={(sec, p, act) => {
          setTime(fmtTime(sec).replace("초", ""));
          if (act) setActual(act);
          else setPours(p);
        }}
      />
      <BeanQuickAdd open={addBean} onClose={() => setAddBean(false)} onAdded={(nb) => patch({ beanId: nb.id })} />
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
