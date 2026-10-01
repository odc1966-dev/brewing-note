"use client";

import { useEffect, useRef, useState } from "react";
import { Droplets, Pause, Play, Plus, RotateCcw, Settings2, Trash2, Volume2, VolumeX, X } from "lucide-react";
import { saveSettings, useStore } from "@/lib/store";
import type { TimerStep } from "@/lib/types";
import { fmtTime, mmss, parseTime } from "@/lib/util";

/**
 * 핸드드립 기본 안내 단계(예시). 뜸 = 원두량의 약 2배 물로 30~45초가 흔한 방식이지만
 * 레시피마다 다르므로 사용자가 고쳐 쓰게 한다(업계 관행, 표준 아님).
 */
export const DEFAULT_STEPS: TimerStep[] = [
  { at: 0, label: "뜸 들이기", pct: -2 }, // pct < 0 : 원두량 × |pct| g
  { at: 40, label: "1차 푸어", pct: 50 },
  { at: 75, label: "2차 푸어", pct: 75 },
  { at: 105, label: "3차 푸어", pct: 100 },
  { at: 135, label: "다 내려올 때까지 대기", pct: 0 },
];


function targetOf(step: TimerStep, dose: number | null, water: number | null) {
  if (step.pct < 0) return dose ? Math.round(dose * -step.pct) : null;
  if (step.pct > 0 && water) return Math.round((water * step.pct) / 100);
  return null;
}

let audio: AudioContext | null = null;
function beep() {
  try {
    audio ??= new AudioContext();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.25);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 0.3);
  } catch {
    /* 소리를 못 내는 환경 */
  }
}

export default function BrewTimer({
  open,
  onClose,
  onFinish,
  dose,
  water,
  guide,
}: {
  open: boolean;
  onClose: () => void;
  onFinish: (seconds: number, pours: number[]) => void;
  dose: number | null;
  water: number | null;
  guide: boolean; // 처음에 단계 안내를 켤지(핸드드립이면 켬)
}) {
  const saved = useStore((s) => s.settings.timerSteps);
  const steps = (saved?.length ? saved : DEFAULT_STEPS).slice().sort((a, b) => a.at - b.at);

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // ms
  const [pours, setPours] = useState<number[]>([]);
  const [useGuide, setUseGuide] = useState(guide);
  const [sound, setSound] = useState(true);
  const [editing, setEditing] = useState(false);
  const startRef = useRef(0); // performance.now() - 이미 흐른 시간
  const lastStep = useRef(-1);
  const wake = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (open) setUseGuide(guide);
  }, [open, guide]);

  // 화면 갱신: rAF 대신 interval(백그라운드 탭에서도 시간 계산은 실제 시각 기준이라 정확)
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed(performance.now() - startRef.current), 100);
    return () => clearInterval(id);
  }, [running]);

  // 단계가 바뀌는 순간 짧은 진동·소리
  const sec = elapsed / 1000;
  const curIdx = useGuide ? steps.reduce((k, s, i) => (sec >= s.at ? i : k), -1) : -1;
  useEffect(() => {
    if (!running || !useGuide) return;
    if (curIdx !== lastStep.current) {
      if (lastStep.current !== -1 || curIdx > 0) {
        navigator.vibrate?.(120);
        if (sound) beep();
      }
      lastStep.current = curIdx;
    }
  }, [curIdx, running, useGuide, sound]);

  // 진행 중에는 화면 꺼짐 방지(지원하는 브라우저만)
  useEffect(() => {
    if (running && "wakeLock" in navigator) {
      navigator.wakeLock.request("screen").then((w) => (wake.current = w)).catch(() => {});
    }
    return () => {
      wake.current?.release().catch(() => {});
      wake.current = null;
    };
  }, [running]);

  function toggle() {
    if (running) {
      setElapsed(performance.now() - startRef.current);
      setRunning(false);
    } else {
      startRef.current = performance.now() - elapsed;
      if (elapsed === 0) lastStep.current = 0;
      if (sound) beep(); // 사용자 동작 안에서 오디오를 깨워 둔다(iOS)
      setRunning(true);
    }
  }

  function reset() {
    setRunning(false);
    setElapsed(0);
    setPours([]);
    lastStep.current = -1;
  }

  function finish() {
    const s = Math.round((running ? performance.now() - startRef.current : elapsed) / 1000);
    onFinish(s, pours);
    reset();
    onClose();
  }

  function close() {
    if (elapsed > 0 && !confirm("타이머를 끝내지 않고 닫을까요? 측정한 시간은 기록되지 않아요.")) return;
    reset();
    onClose();
  }

  if (!open) return null;

  const cur = curIdx >= 0 ? steps[curIdx] : null;
  const next = useGuide ? steps.find((s) => s.at > sec) : undefined;
  const curTarget = cur ? targetOf(cur, dose, water) : null;
  const nextTarget = next ? targetOf(next, dose, water) : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-espresso text-white">
      <div className="safe-bottom mx-auto flex w-full max-w-[560px] flex-1 flex-col px-5 pt-4">
        <div className="flex items-center justify-between">
          <button aria-label="닫기" onClick={close} className="grid h-11 w-11 place-items-center rounded-full bg-white/10">
            <X size={22} />
          </button>
          <div className="flex gap-2">
            <button aria-label={sound ? "소리 끄기" : "소리 켜기"} onClick={() => setSound((v) => !v)} className="grid h-11 w-11 place-items-center rounded-full bg-white/10">
              {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button aria-label="안내 단계 편집" onClick={() => setEditing(true)} className="grid h-11 w-11 place-items-center rounded-full bg-white/10">
              <Settings2 size={20} />
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="text-[84px] font-extrabold leading-none tabular-nums" aria-live="off">
            {mmss(sec)}
          </div>
          {(dose || water) && (
            <div className="mt-2 text-sm text-white/60">
              {dose ? `원두 ${dose}g` : ""}
              {dose && water ? " · " : ""}
              {water ? `물 ${water}g` : ""}
            </div>
          )}
        </div>

        <label className="mx-auto mt-4 flex items-center gap-2 text-sm text-white/80">
          <input type="checkbox" checked={useGuide} onChange={(e) => setUseGuide(e.target.checked)} className="h-5 w-5 accent-[#e0a23a]" />
          단계 안내
        </label>

        {useGuide && (
          <div className="mt-4 space-y-2">
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-xs text-white/60">지금</div>
              <div className="text-2xl font-bold">{cur ? cur.label : "시작을 누르세요"}</div>
              {curTarget && <div className="mt-1 text-lg text-[#f3c77a]">누적 {curTarget}g 까지</div>}
            </div>
            {next && (
              <div className="rounded-2xl border border-white/15 px-4 py-3 text-sm text-white/80">
                다음: <b>{next.label}</b> · {Math.max(0, Math.ceil(next.at - sec))}초 후{nextTarget ? ` · 누적 ${nextTarget}g` : ""}
              </div>
            )}
          </div>
        )}

        {pours.length > 0 && (
          <div className="mt-4 text-center text-sm text-white/70">푸어 기록: {pours.map(mmss).join(" · ")}</div>
        )}

        <div className="mt-auto grid grid-cols-3 items-center gap-3 pb-6 pt-6">
          <button onClick={reset} className="flex flex-col items-center gap-1 text-sm text-white/80">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/10">
              <RotateCcw size={24} />
            </span>
            초기화
          </button>
          <button
            onClick={toggle}
            aria-label={running ? "일시정지" : "시작"}
            className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#e0a23a] text-espresso shadow-lg"
          >
            {running ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
          </button>
          <button
            onClick={() => setPours((p) => [...p, Math.round(sec)])}
            disabled={!running}
            className="flex flex-col items-center gap-1 text-sm text-white/80 disabled:opacity-40"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/10">
              <Droplets size={24} />
            </span>
            푸어 기록
          </button>
        </div>
        <button
          onClick={finish}
          disabled={elapsed === 0}
          className="mb-6 rounded-2xl bg-white py-4 text-[16px] font-bold text-espresso disabled:opacity-40"
        >
          끝내고 기록에 넣기 {elapsed > 0 && `(${fmtTime(Math.round(sec))})`}
        </button>
      </div>

      {editing && <StepEditor steps={steps} onClose={() => setEditing(false)} />}
    </div>
  );
}

function StepEditor({ steps, onClose }: { steps: TimerStep[]; onClose: () => void }) {
  const [rows, setRows] = useState(steps.map((s) => ({ at: mmss(s.at), label: s.label, pct: String(s.pct) })));
  const set = (i: number, p: Partial<(typeof rows)[number]>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...p } : x)));

  function save(reset = false) {
    if (reset) saveSettings({ timerSteps: undefined });
    else
      saveSettings({
        timerSteps: rows
          .map((r) => ({ at: parseTime(r.at) ?? 0, label: r.label.trim() || "단계", pct: Number(r.pct) || 0 }))
          .sort((a, b) => a.at - b.at),
      });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-bg text-ink">
      <div className="mx-auto max-w-[560px] p-4">
        <h2 className="text-center text-[17px] font-bold">안내 단계 편집</h2>
        <p className="mt-2 text-sm leading-relaxed text-sub">
          시각(분:초)·이름·물 목표를 적어요. 물 목표는 전체 물의 누적 % 이고, <b>-2</b> 처럼 음수로 쓰면 원두량의 2배(g)를 뜻해요(뜸). 0 이면 물 안내가
          없어요. 기본값은 흔히 쓰는 예시일 뿐이니 내 레시피에 맞게 바꾸세요.
        </p>
        <div className="mt-3 grid grid-cols-[72px_1fr_64px_40px] gap-1.5 px-1 text-xs font-semibold text-sub">
          <span>시각</span>
          <span>이름</span>
          <span>물 %</span>
          <span />
        </div>
        <div className="space-y-1.5">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[72px_1fr_64px_40px] gap-1.5">
              <input value={r.at} onChange={(e) => set(i, { at: e.target.value })} className="rounded-lg border border-line bg-card px-2 py-2.5" />
              <input value={r.label} onChange={(e) => set(i, { label: e.target.value })} className="min-w-0 rounded-lg border border-line bg-card px-2 py-2.5" />
              <input value={r.pct} onChange={(e) => set(i, { pct: e.target.value })} inputMode="numeric" className="rounded-lg border border-line bg-card px-2 py-2.5" />
              <button aria-label="단계 삭제" onClick={() => setRows((x) => x.filter((_, j) => j !== i))} className="grid place-items-center text-red-700">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setRows((r) => [...r, { at: r.length ? mmss((parseTime(r[r.length - 1].at) ?? 0) + 30) : "0:00", label: "푸어", pct: "100" }])}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-accent py-2.5 text-sm text-accent"
        >
          <Plus size={16} /> 단계 추가
        </button>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <button onClick={() => save(true)} className="rounded-xl border border-line bg-card py-3 text-sm">
            기본값으로
          </button>
          <button onClick={onClose} className="rounded-xl border border-line bg-card py-3 text-sm">
            취소
          </button>
          <button onClick={() => save()} className="rounded-xl bg-espresso py-3 text-sm font-bold text-white">
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
