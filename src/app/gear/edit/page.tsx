"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { remove, upsert, useStore } from "@/lib/store";
import { GEAR_KINDS } from "@/lib/constants";
import type { Gear } from "@/lib/types";
import { uid } from "@/lib/util";
import { ConfirmDelete, Header, Label, PrimaryButton, TextInput } from "@/components/ui";

function Editor() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const gear = useStore((s) => s.gear);
  const existing = gear.find((g) => g.id === id);
  const [g, setG] = useState<Gear>(() => (existing ? { ...existing } : { id: uid(), kind: "grinder", name: "", memo: "", createdAt: Date.now() }));
  const patch = (p: Partial<Gear>) => setG((x) => ({ ...x, ...p }));

  return (
    <div>
      <Header title={existing ? "장비 정보" : "장비 등록"} back />
      <div className="px-4">
        <Label>종류</Label>
        <div className="grid grid-cols-3 gap-2">
          {GEAR_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => patch({ kind: k.id })}
              className={`rounded-xl border py-3 text-sm font-semibold ${g.kind === k.id ? "border-espresso bg-espresso text-white" : "border-line bg-card"}`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <Label>이름</Label>
        <TextInput value={g.name} onChange={(e) => patch({ name: e.target.value })} placeholder="예: 코만단테 C40, V60 02" />
        <Label hint="선택">메모</Label>
        <TextInput value={g.memo} onChange={(e) => patch({ memo: e.target.value })} placeholder="예: 핸드드립은 24클릭부터" />

        <PrimaryButton
          className="mt-6"
          disabled={!g.name.trim()}
          onClick={async () => {
            await upsert("gear", { ...g, name: g.name.trim(), memo: g.memo.trim() });
            router.back();
          }}
        >
          저장
        </PrimaryButton>

        {existing && (
          <div className="mt-8">
            <ConfirmDelete
              label="장비 삭제"
              onConfirm={async () => {
                await remove("gear", existing.id);
                router.replace("/beans/?tab=gear");
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
