"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveSettings, useStore } from "@/lib/store";
import { findEntry } from "@/lib/recipeLib";
import { REF_GROUPS, type RefGroup, type RefRecipe } from "@/lib/refRecipes";
import { cloneSteps, recipeTotal } from "@/lib/recipe";
import type { RecipeStep, SavedRecipe } from "@/lib/types";
import { num, uid } from "@/lib/util";
import { Header, Label, NumBox, PrimaryButton, Segment, TextArea, TextInput } from "@/components/ui";
import { StepList } from "@/components/RecipeEditor";
import { PhotoPicker, useDraftPhotos } from "@/components/Photos";

const str = (n: number | null | undefined) => (n == null ? "" : String(n));

function Editor() {
  const router = useRouter();
  const sp = useSearchParams();
  const settings = useStore((s) => s.settings);
  const editKey = sp.get("id");
  const existing = editKey ? findEntry(settings, editKey) : undefined;
  const kind: "my" | "c" = existing ? (existing.kind === "my" ? "my" : "c") : sp.get("kind") === "my" ? "my" : "c";
  const src = existing?.r;

  const [name, setName] = useState(src?.name ?? "");
  const [author, setAuthor] = useState(kind === "c" ? src?.author ?? "" : "");
  const [group, setGroup] = useState<RefGroup>(kind === "c" ? src?.group ?? "custom" : "custom");
  const [year, setYear] = useState(str(src?.year));
  const [serve, setServe] = useState<"HOT" | "ICE">(src?.serve ?? "HOT");
  const [brewer, setBrewer] = useState(src?.brewer ?? (kind === "my" ? "핸드드립" : ""));
  const [dose, setDose] = useState(str(src?.dose));
  const [water, setWater] = useState(str(src?.water));
  const [ice, setIce] = useState(str(src?.ice));
  const [temp, setTemp] = useState(str(src?.temp));
  const [total, setTotal] = useState(src?.total ?? "");
  const [grinder, setGrinder] = useState(src?.grind.grinder ?? "");
  const [setting, setSetting] = useState(src?.grind.setting ?? "");
  const [grindDesc, setGrindDesc] = useState(src?.grind.desc ?? "");
  const [bean, setBean] = useState(src?.bean ?? "");
  const [intent, setIntent] = useState(src?.intent ?? "");
  const [srcLabel, setSrcLabel] = useState(src?.sources[0]?.label ?? "");
  const [srcUrl, setSrcUrl] = useState(src?.sources[0]?.url ?? "");
  const [steps, setSteps] = useState<RecipeStep[]>(() => (src?.steps.length ? cloneSteps(src.steps) : [])); // 새 레시피는 원두량을 적은 뒤 "뜸 들이기 추가"로 시작
  const [photos, setPhotos, commitPhotos] = useDraftPhotos(src?.photos ?? []);

  const sum = recipeTotal(steps);
  const w = num(water);
  const mismatch = sum > 0 && w !== null && Math.abs(sum - w) >= 1;

  async function save() {
    const id = existing ? (existing.kind === "my" ? existing.saved!.id : existing.r.id) : uid();
    if (kind === "my") {
      const prev = existing?.saved;
      const out: SavedRecipe = {
        id,
        name: name.trim(),
        method: brewer.trim() || "핸드드립",
        dose: num(dose),
        water: num(water),
        temp: num(temp),
        grind: grindDesc.trim(),
        steps,
        createdAt: prev?.createdAt ?? Date.now(),
        serve,
        ice: serve === "ICE" ? num(ice) : null,
        memo: intent.trim(),
        fromRef: prev?.fromRef,
        fromName: prev?.fromName,
      };
      const list = settings.recipes ?? [];
      await saveSettings({ recipes: prev ? list.map((x) => (x.id === id ? out : x)) : [...list, out] });
    } else {
      const out: RefRecipe = {
        id,
        name: name.trim(),
        author: author.trim() || "모름",
        group,
        year: num(year) ?? undefined,
        serve,
        brewer: brewer.trim() || "–",
        dose: num(dose),
        water: num(water),
        ice: serve === "ICE" ? num(ice) : null,
        temp: num(temp),
        grind: { grinder: grinder.trim() || undefined, setting: setting.trim() || undefined, desc: grindDesc.trim() || undefined },
        bean: bean.trim() || undefined,
        intent: intent.trim(),
        steps,
        total: total.trim() || undefined,
        sources: srcUrl.trim() ? [{ label: srcLabel.trim() || srcUrl.trim(), url: srcUrl.trim() }] : [],
        photos,
        createdAt: src?.createdAt ?? Date.now(),
      };
      const list = settings.customRefs ?? [];
      await saveSettings({ customRefs: existing ? list.map((x) => (x.id === id ? out : x)) : [...list, out] });
    }
    commitPhotos();
    router.replace(`/recipes/view/?id=${encodeURIComponent((kind === "my" ? "my:" : "c:") + id)}`);
  }

  const title = existing ? "레시피 고치기" : kind === "my" ? "내 레시피 만들기" : "다른 사람 레시피 추가";

  return (
    <div>
      <Header title={title} back />
      <div className="px-4">
        {kind === "c" && !existing && (
          <p className="mb-2 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">
            로스터리 레시피 카드나 인스타·유튜브에서 본 레시피를 옮겨 적어 두세요. 카드 사진도 함께 저장할 수 있어요.
          </p>
        )}

        <Label>레시피 이름</Label>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === "my" ? "예: 에티오피아용 5회 푸어" : "예: ○○로스터스 V60 레시피"} />

        {kind === "c" && (
          <>
            <div className="grid grid-cols-[2fr_1fr] gap-2">
              <div>
                <Label>만든 사람·로스터리</Label>
                <TextInput value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="예: ○○ 바리스타" />
              </div>
              <div>
                <Label hint="선택">연도</Label>
                <TextInput inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026" />
              </div>
            </div>
            <Label>분류</Label>
            <div className="flex flex-wrap gap-1.5">
              {REF_GROUPS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  aria-pressed={group === g.id}
                  onClick={() => setGroup(g.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${group === g.id ? "border-espresso bg-espresso text-white" : "border-line bg-card"}`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </>
        )}

        <Label>HOT · ICE</Label>
        <Segment
          options={[
            { id: "HOT", label: "HOT" },
            { id: "ICE", label: "ICE" },
          ]}
          value={serve}
          onChange={setServe}
        />

        <Label>드리퍼</Label>
        <TextInput value={brewer} onChange={(e) => setBrewer(e.target.value)} placeholder="예: 하리오 V60" />

        <Label>추출 변수</Label>
        <div className="grid grid-cols-3 gap-2">
          <NumBox label="원두" unit="g" value={dose} onChange={setDose} placeholder="15" />
          <NumBox label={serve === "ICE" ? "뜨거운 물" : "물"} unit="g" value={water} onChange={setWater} placeholder="250" />
          {serve === "ICE" && <NumBox label="얼음" unit="g" value={ice} onChange={setIce} placeholder="100" />}
          <NumBox label="수온" unit="°C" value={temp} onChange={setTemp} placeholder="93" />
          {kind === "c" && <NumBox label="총 시간" value={total} onChange={setTotal} inputMode="text" placeholder="3:00" />}
        </div>

        <Label hint={kind === "c" ? "만든 사람이 쓴 그라인더와 설정" : undefined}>분쇄도</Label>
        {kind === "c" ? (
          <div className="grid grid-cols-3 gap-2">
            <NumBox label="그라인더" value={grinder} onChange={setGrinder} inputMode="text" placeholder="코만단테" />
            <NumBox label="설정" value={setting} onChange={setSetting} inputMode="text" placeholder="24클릭" />
            <NumBox label="굵기 설명" value={grindDesc} onChange={setGrindDesc} inputMode="text" placeholder="중간" />
          </div>
        ) : (
          <TextInput value={grindDesc} onChange={(e) => setGrindDesc(e.target.value)} placeholder="예: 코만단테 24클릭" />
        )}

        {kind === "c" && (
          <>
            <Label hint="선택">추천 원두 성향</Label>
            <TextInput value={bean} onChange={(e) => setBean(e.target.value)} placeholder="예: 라이트 로스팅 워시드" />
          </>
        )}

        <Label hint="선택">{kind === "c" ? "만든 사람의 설명·의도" : "내 메모"}</Label>
        <TextArea value={intent} onChange={(e) => setIntent(e.target.value)} placeholder={kind === "c" ? "왜 이렇게 붓는지, 맛을 바꾸려면 무엇을 조절하는지" : "이 레시피를 쓰는 원두, 바꿔 볼 점"} />

        <Label hint="뜸 들이기 · N차 푸어">단계</Label>
        {mismatch && (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-xs text-orange-800">
            <span className="flex-1">단계 합계({sum}g)가 물({w}g)과 달라요.</span>
            <button type="button" onClick={() => setWater(String(sum))} className="shrink-0 rounded-lg bg-orange-700 px-2 py-1 font-semibold text-white">
              물을 {sum}g으로
            </button>
          </div>
        )}
        <StepList steps={steps} onChange={setSteps} dose={num(dose)} />

        {kind === "c" && (
          <>
            <Label hint="레시피 카드·캡처, 최대 3장">사진</Label>
            <PhotoPicker value={photos} onChange={setPhotos} />
            <Label hint="선택">출처</Label>
            <TextInput value={srcLabel} onChange={(e) => setSrcLabel(e.target.value)} placeholder="출처 이름(예: ○○로스터스 인스타)" />
            <TextInput className="mt-2" type="url" value={srcUrl} onChange={(e) => setSrcUrl(e.target.value)} placeholder="https://" />
          </>
        )}

        <PrimaryButton className="mt-6" onClick={save} disabled={!name.trim()}>
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
