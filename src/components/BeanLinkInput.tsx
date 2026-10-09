"use client";

import { useMemo, useState } from "react";
import { Link2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Bean, CafeLog } from "@/lib/types";
import { newBean } from "./BeanQuickAdd";
import { upsert } from "@/lib/store";

/**
 * 카페 기록의 원두 칸: 글자로 적거나, 예전에 기록한 원두를 골라 연결한다.
 * 저장할 때 resolveCafeBean 이 연결할 원두를 정한다(없으면 '카페 원두'로 새로 만든다).
 */
export default function BeanLinkInput({
  text,
  beanId,
  onChange,
}: {
  text: string;
  beanId?: string;
  onChange: (text: string, beanId?: string) => void;
}) {
  const beans = useStore((s) => s.beans);
  const [focus, setFocus] = useState(false);
  const linked = beans.find((b) => b.id === beanId);

  const suggestions = useMemo(() => {
    const q = text.trim().toLowerCase();
    return beans
      .filter((b) => b.id !== beanId && (!q || [b.name, b.roaster, b.origin].join(" ").toLowerCase().includes(q)))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 6);
  }, [beans, text, beanId]);

  return (
    <div>
      {linked ? (
        <div className="flex items-center gap-2 rounded-xl border border-accent bg-accent-soft px-3 py-2.5">
          <Link2 size={17} className="shrink-0 text-accent" />
          <span className="min-w-0 flex-1 truncate font-semibold">
            {linked.name}
            {linked.roaster && <span className="font-normal text-sub"> · {linked.roaster}</span>}
          </span>
          <button type="button" aria-label="연결 풀기" onClick={() => onChange(linked.name, undefined)} className="text-sub">
            <X size={18} />
          </button>
        </div>
      ) : (
        <input
          value={text}
          onChange={(e) => onChange(e.target.value, undefined)}
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 150)}
          placeholder="예: 케냐 AA (예전 원두를 고르거나 새로 적기)"
          className="w-full rounded-xl border border-line bg-card px-3.5 py-3 outline-none placeholder:text-sub/60 focus:border-accent"
        />
      )}
      {!linked && (focus || text) && suggestions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {suggestions.map((b) => (
            <button
              key={b.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange(b.name, b.id)}
              className="rounded-full border border-line bg-card px-3 py-1.5 text-sm"
            >
              {b.name}
              <span className="text-xs text-sub">{b.cafeOnly ? " · 카페" : b.roaster ? ` · ${b.roaster}` : ""}</span>
            </button>
          ))}
        </div>
      )}
      {!linked && text.trim() && (
        <p className="mt-1 px-1 text-xs text-sub">저장하면 기록 탭의 ‘원두’ 칸에 이 원두가 모여요.</p>
      )}
    </div>
  );
}

/** 저장 직전: 카페 기록에 연결할 원두 id 를 정한다(필요하면 새 '카페 원두'를 만든다) */
export async function resolveCafeBean(log: CafeLog, beans: Bean[]): Promise<string | undefined> {
  const name = log.beanInfo.trim();
  if (log.beanId && beans.some((b) => b.id === log.beanId)) return log.beanId;
  if (!name) return undefined;
  const same = beans.find((b) => b.name.trim().toLowerCase() === name.toLowerCase());
  if (same) return same.id;
  const b = newBean({ name, roaster: log.cafe.trim(), cafeOnly: true });
  await upsert("beans", b);
  return b.id;
}
