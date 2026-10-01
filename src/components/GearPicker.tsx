"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { upsert, useStore } from "@/lib/store";
import { GEAR_KINDS } from "@/lib/constants";
import type { Gear, GearKind } from "@/lib/types";
import { uid } from "@/lib/util";
import { GhostButton, Label, Modal, PrimaryButton, TextInput } from "./ui";

/** 종류마다 하나씩 고른다(같은 종류를 다시 누르면 해제). '기타'만 여러 개 가능 */
const MULTI: GearKind[] = ["etc"];

export default function GearPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const gear = useStore((s) => s.gear);
  const [adding, setAdding] = useState<GearKind | null>(null);

  function pick(g: Gear) {
    if (value.includes(g.id)) return onChange(value.filter((x) => x !== g.id));
    if (MULTI.includes(g.kind)) return onChange([...value, g.id]);
    // 같은 종류의 다른 장비는 빼고 이것으로 교체
    const sameKind = new Set(gear.filter((x) => x.kind === g.kind).map((x) => x.id));
    onChange([...value.filter((x) => !sameKind.has(x)), g.id]);
  }

  const kinds = GEAR_KINDS.filter((k) => gear.some((g) => g.kind === k.id));

  return (
    <div>
      {gear.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-4 py-4 text-center text-sm text-sub">
          등록한 장비가 없어요. 그라인더·드리퍼 등을 등록하면 다음부터 눌러서 고를 수 있어요.
        </div>
      ) : (
        <div className="space-y-2 rounded-2xl border border-line bg-card p-3">
          {kinds.map((k) => (
            <div key={k.id} className="flex items-start gap-2">
              <span className="w-14 shrink-0 pt-2 text-xs font-semibold text-sub">{k.label}</span>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {gear
                  .filter((g) => g.kind === k.id)
                  .sort((a, b) => a.createdAt - b.createdAt)
                  .map((g) => {
                    const on = value.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => pick(g)}
                        className={`rounded-full border px-3 py-2 text-sm ${on ? "border-espresso bg-espresso text-white" : "border-line bg-bg"}`}
                      >
                        {g.name}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {GEAR_KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setAdding(k.id)}
            className="flex items-center gap-0.5 rounded-full border border-dashed border-accent px-2.5 py-1.5 text-xs text-accent"
          >
            <Plus size={13} /> {k.label}
          </button>
        ))}
      </div>

      <GearQuickAdd
        kind={adding}
        onClose={() => setAdding(null)}
        onAdded={(g) => {
          const sameKind = MULTI.includes(g.kind) ? new Set<string>() : new Set(gear.filter((x) => x.kind === g.kind).map((x) => x.id));
          onChange([...value.filter((x) => !sameKind.has(x)), g.id]);
        }}
      />
    </div>
  );
}

function GearQuickAdd({ kind, onClose, onAdded }: { kind: GearKind | null; onClose: () => void; onAdded: (g: Gear) => void }) {
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");
  const label = GEAR_KINDS.find((k) => k.id === kind)?.label ?? "";

  async function add() {
    if (!kind) return;
    const g: Gear = { id: uid(), kind, name: name.trim(), memo: memo.trim(), createdAt: Date.now() };
    await upsert("gear", g);
    onAdded(g);
    setName("");
    setMemo("");
    onClose();
  }

  return (
    <Modal open={!!kind} onClose={onClose}>
      <h2 className="text-center text-[17px] font-bold">새 {label}</h2>
      <Label>이름</Label>
      <TextInput
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={kind === "grinder" ? "예: 코만단테 C40" : kind === "dripper" ? "예: V60 02" : "이름"}
      />
      <Label hint="선택">메모</Label>
      <TextInput
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder={kind === "grinder" ? "예: 핸드드립은 24클릭부터" : "예: 구입일, 특징"}
      />
      <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
        <GhostButton onClick={onClose}>취소</GhostButton>
        <PrimaryButton onClick={add} disabled={!name.trim()}>
          추가하고 선택
        </PrimaryButton>
      </div>
    </Modal>
  );
}
