"use client";

import { useState } from "react";
import { upsert } from "@/lib/store";
import type { Bean } from "@/lib/types";
import { uid } from "@/lib/util";
import { GhostButton, Label, Modal, PrimaryButton, TextInput } from "./ui";

export function newBean(p: Partial<Bean> = {}): Bean {
  return {
    id: uid(),
    name: "",
    roaster: "",
    origin: "",
    process: "",
    roast: "",
    roastDate: "",
    cupNotes: [],
    notes: "",
    archived: false,
    createdAt: Date.now(),
    ...p,
  };
}

/** 기록 중에 바로 원두를 등록하는 작은 창 (자세한 정보는 원두 화면에서) */
export default function BeanQuickAdd({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (b: Bean) => void }) {
  const [name, setName] = useState("");
  const [roaster, setRoaster] = useState("");
  const [roastDate, setRoastDate] = useState("");

  function add() {
    const b = newBean({ name: name.trim(), roaster: roaster.trim(), roastDate });
    upsert("beans", b);
    onAdded(b);
    setName("");
    setRoaster("");
    setRoastDate("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-center text-[17px] font-bold">새 원두</h2>
      <Label>원두 이름</Label>
      <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="예: Ethiopia Yirgacheffe" />
      <Label>로스터리</Label>
      <TextInput value={roaster} onChange={(e) => setRoaster(e.target.value)} placeholder="예: 동네 로스터리" />
      <Label>로스팅 날짜</Label>
      <TextInput type="date" value={roastDate} onChange={(e) => setRoastDate(e.target.value)} />
      <p className="mt-2 px-1 text-xs text-sub">원산지·가공 방식 등은 원두·장비 탭에서 더 적을 수 있어요.</p>
      <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
        <GhostButton onClick={onClose}>취소</GhostButton>
        <PrimaryButton onClick={add} disabled={!name.trim()}>
          추가
        </PrimaryButton>
      </div>
    </Modal>
  );
}
