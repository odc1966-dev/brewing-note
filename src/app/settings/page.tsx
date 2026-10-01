"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { exportData, importData, saveSettings, useStore, wipeAll } from "@/lib/store";
import { METHODS } from "@/lib/constants";
import { today } from "@/lib/util";
import { Card, ChipSelect, ConfirmDelete, GhostButton, Header, Label, Section, TextInput } from "@/components/ui";

export default function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const counts = useStore((s) => s);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const [nick, setNick] = useState(settings.nickname);
  const [temp, setTemp] = useState(String(settings.defaultTemp));

  async function backup() {
    setMsg("백업 파일을 만드는 중…");
    const blob = new Blob([JSON.stringify(await exportData(true))], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `brewing-note-backup-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setMsg(`백업 파일을 저장했어요(${blob.size > 1048576 ? (blob.size / 1048576).toFixed(1) + "MB" : Math.max(1, Math.round(blob.size / 1024)) + "KB"}, 사진 포함). 클라우드 드라이브 등 안전한 곳에 보관하세요.`);
  }

  async function restore(f: File) {
    try {
      const data = JSON.parse(await f.text());
      if (!confirm("지금 기기에 있는 기록을 모두 지우고 백업 파일 내용으로 바꿉니다. 계속할까요?")) return;
      const r = await importData(data);
      setNick(data.settings?.nickname ?? "");
      setMsg(`복원 완료: 추출 ${r.brews}개 · 카페 ${r.cafes}개 · 원두 ${r.beans}개 · 사진 ${r.photos}장`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "파일을 읽을 수 없어요.");
    }
  }

  return (
    <div>
      <Header title="설정" />
      <div className="px-4">
        <Section title="기본값">
          <Card>
            <Label>닉네임</Label>
            <TextInput
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              onBlur={() => saveSettings({ nickname: nick.trim() })}
              placeholder="홈 화면과 공유 카드에 표시돼요"
            />
            <Label>자주 쓰는 추출 방식</Label>
            <ChipSelect options={METHODS} value={settings.defaultMethod} onChange={(v) => saveSettings({ defaultMethod: v })} allowEmpty={false} />
            <Label>기본 수온 (°C)</Label>
            <TextInput
              inputMode="numeric"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              onBlur={() => {
                const n = Number(temp);
                if (Number.isFinite(n) && n > 0 && n <= 100) saveSettings({ defaultTemp: n });
                else setTemp(String(settings.defaultTemp));
              }}
            />
          </Card>
        </Section>

        <Section title="백업과 복원">
          <Card>
            <p className="text-sm leading-relaxed text-sub">
              기록은 이 기기의 브라우저 안에만 저장돼요. 앱을 지우거나 브라우저 데이터를 삭제하면 기록도 사라지니 가끔 백업 파일을 저장해 두세요.
            </p>
            <p className="mt-2 text-sm">
              추출 {counts.brews.length} · 카페 {counts.cafes.length} · 원두 {counts.beans.length} · 장비 {counts.gear.length}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <GhostButton onClick={backup}>
                <Download size={18} /> 백업 저장
              </GhostButton>
              <GhostButton onClick={() => fileRef.current?.click()}>
                <Upload size={18} /> 복원
              </GhostButton>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) restore(f);
                e.target.value = "";
              }}
            />
            {msg && <p className="mt-3 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">{msg}</p>}
          </Card>
        </Section>

        <Section title="모든 기록 지우기">
          <ConfirmDelete
            label="모든 기록 지우기"
            onConfirm={async () => {
              await wipeAll();
              setNick("");
              setMsg("모든 기록을 지웠어요.");
            }}
          />
        </Section>

        <p className="mt-8 text-center text-xs text-sub">Brewing note v0.1 · 기록은 기기 밖으로 전송되지 않아요</p>
      </div>
    </div>
  );
}
