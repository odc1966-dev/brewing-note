"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronDown, Folder, FolderOpen } from "lucide-react";

export interface Group<T> {
  key: string;
  label: string;
  items: T[];
  latest: string; // 가장 최근 날짜(정렬·표시용)
}

/** items 를 keyOf 로 묶는다. 정렬: date 모드는 키 내림차순, 나머지는 최근 기록 순(미지정은 맨 뒤) */
export function groupBy<T>(
  items: T[],
  keyOf: (x: T) => string,
  dateOf: (x: T) => string,
  opts: { byKeyDesc?: boolean; labelOf?: (key: string) => string; unknown?: string } = {},
): Group<T>[] {
  const map = new Map<string, T[]>();
  for (const x of items) {
    const k = keyOf(x) || "";
    map.set(k, [...(map.get(k) ?? []), x]);
  }
  const groups = [...map.entries()].map(([key, list]) => ({
    key,
    label: key ? (opts.labelOf ? opts.labelOf(key) : key) : (opts.unknown ?? "미지정"),
    items: list,
    latest: list.map(dateOf).sort().at(-1) ?? "",
  }));
  return groups.sort((a, b) => {
    if (!a.key !== !b.key) return a.key ? -1 : 1; // 미지정은 뒤로
    return opts.byKeyDesc ? b.key.localeCompare(a.key) : b.latest.localeCompare(a.latest) || a.label.localeCompare(b.label);
  });
}

/**
 * 폴더처럼 접고 펴는 묶음 목록.
 * defaultOpen: 처음에 펼칠지(날짜 보기 = 펼침, 나머지 = 접힘). forceOpen: 검색 중엔 모두 펼침.
 */
export function FolderList<T>({
  groups,
  render,
  defaultOpen,
  forceOpen,
  resetKey,
  dateStyle = false,
}: {
  groups: Group<T>[];
  render: (x: T) => React.ReactNode;
  defaultOpen: boolean;
  forceOpen: boolean;
  resetKey: string; // 보기 방식이 바뀌면 펼침 상태를 처음으로
  dateStyle?: boolean;
}) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  useEffect(() => setFlipped(new Set()), [resetKey]);

  return (
    <div className="space-y-2">
      {groups.map((g) => {
        const open = forceOpen || (flipped.has(g.key) ? !defaultOpen : defaultOpen);
        const Icon = dateStyle ? CalendarDays : open ? FolderOpen : Folder;
        return (
          <section key={g.key} className={dateStyle ? "" : "rounded-2xl border border-line bg-card/60"}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() =>
                setFlipped((s) => {
                  const n = new Set(s);
                  if (n.has(g.key)) n.delete(g.key);
                  else n.add(g.key);
                  return n;
                })
              }
              className={`flex w-full items-center gap-2.5 text-left ${dateStyle ? "px-1 py-2" : "px-3 py-3"}`}
            >
              <Icon size={dateStyle ? 16 : 20} className={dateStyle ? "text-sub" : "text-accent"} />
              <span className={`min-w-0 flex-1 truncate ${dateStyle ? "text-sm font-bold text-sub" : "font-semibold"}`}>{g.label}</span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${dateStyle ? "text-sub" : "bg-cream"}`}>{g.items.length}</span>
              <ChevronDown size={18} className={`shrink-0 text-sub transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && <div className={`space-y-2 ${dateStyle ? "pb-3" : "px-2 pb-2"}`}>{g.items.map(render)}</div>}
          </section>
        );
      })}
    </div>
  );
}
