"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Star } from "lucide-react";
import { useState } from "react";
import { tagColor, tagLabel } from "@/lib/constants";

export function Header({ title, back = false, right }: { title: string; back?: boolean; right?: React.ReactNode }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-1 bg-bg/95 px-2 backdrop-blur">
      {back ? (
        <button
          aria-label="뒤로"
          onClick={() => (history.length > 1 ? router.back() : router.push("/"))}
          className="grid h-11 w-11 place-items-center rounded-full text-ink active:bg-cream"
        >
          <ChevronLeft size={26} />
        </button>
      ) : (
        <span className="w-3" />
      )}
      <h1 className="flex-1 truncate text-[17px] font-bold">{title}</h1>
      <div className="flex items-center gap-1 pr-1">{right}</div>
    </header>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-card p-4 ${className}`}>{children}</div>;
}

export function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-[15px] font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** 별점. editable 이면 별의 왼쪽 절반을 누르면 0.5점 */
export function Stars({
  value,
  onChange,
  size = 16,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  const editable = !!onChange;
  return (
    <div className="flex items-center" role={editable ? "slider" : "img"} aria-label={`별점 ${value}점`} aria-valuenow={value}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        const star = (
          <span className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-line" fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="text-[#e0a23a]" fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
        if (!editable) return <span key={i}>{star}</span>;
        return (
          <button
            key={i}
            type="button"
            className="p-1"
            aria-label={`${i}점`}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const half = e.clientX - r.left < r.width / 2;
              const v = half ? i - 0.5 : i;
              onChange!(v === value ? 0 : v);
            }}
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}

export function TagChip({ id, small = false }: { id: string; small?: boolean }) {
  const c = tagColor(id);
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"}`}
      style={{ color: c, borderColor: c + "55", background: c + "14" }}
    >
      {tagLabel(id)}
    </span>
  );
}

/** 칩 하나 고르기(다시 누르면 해제) */
export function ChipSelect({
  options,
  value,
  onChange,
  allowEmpty = true,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  allowEmpty?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o === value;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(on && allowEmpty ? "" : o)}
            className={`rounded-full border px-3 py-2 text-sm ${on ? "border-espresso bg-espresso text-white" : "border-line bg-card"}`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5 mt-4 flex items-baseline gap-2 px-0.5 text-[13px] font-semibold text-sub">
      {children}
      {hint && <span className="font-normal opacity-75">{hint}</span>}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-line bg-card px-3.5 py-3 outline-none placeholder:text-sub/60 focus:border-accent";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={`${inputCls} resize-none ${props.className ?? ""}`} />;
}

/** 숫자 + 단위 상자 (추출 변수 격자용) */
export function NumBox({
  label,
  unit,
  value,
  onChange,
  inputMode = "decimal",
  placeholder,
}: {
  label: string;
  unit?: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: "decimal" | "numeric" | "text";
  placeholder?: string;
}) {
  return (
    <label className="block rounded-xl border border-line bg-card px-3 py-2 focus-within:border-accent">
      <span className="block text-[11px] text-sub">{label}</span>
      <span className="flex items-baseline gap-1">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode={inputMode}
          placeholder={placeholder}
          className="w-full min-w-0 bg-transparent text-lg font-bold outline-none placeholder:font-normal placeholder:text-sub/50"
        />
        {unit && <span className="shrink-0 text-sm text-sub">{unit}</span>}
      </span>
    </label>
  );
}

export function Segment<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-xl bg-cream p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold ${value === o.id ? "bg-espresso text-white shadow" : "text-sub"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PrimaryButton({ children, className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-espresso py-4 text-[16px] font-bold text-white active:opacity-90 disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className={`flex items-center justify-center gap-2 rounded-2xl border border-line bg-card px-4 py-3.5 text-[15px] font-semibold active:bg-cream ${className}`}
    >
      {children}
    </button>
  );
}

export function Empty({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      {desc && <p className="mt-1 text-sm text-sub">{desc}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/** 두 번 눌러야 실행되는 삭제 버튼 */
export function ConfirmDelete({ onConfirm, label = "삭제" }: { onConfirm: () => void; label?: string }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      type="button"
      onClick={() => (armed ? onConfirm() : (setArmed(true), setTimeout(() => setArmed(false), 3000)))}
      className={`w-full rounded-2xl py-3.5 text-[15px] font-semibold ${armed ? "bg-red-700 text-white" : "text-red-700"}`}
    >
      {armed ? "한 번 더 누르면 삭제됩니다" : label}
    </button>
  );
}

export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 sm:items-center" onClick={onClose}>
      <div
        className="sheet-up safe-bottom max-h-[92dvh] w-full max-w-[560px] overflow-y-auto rounded-t-3xl bg-bg p-4 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
