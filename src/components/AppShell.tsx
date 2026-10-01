"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, NotebookPen, Package, Settings } from "lucide-react";
import { clearError, loadAll, useStore } from "@/lib/store";
import { asset } from "@/lib/base";

const TABS = [
  { href: "/", label: "홈", icon: Coffee },
  { href: "/records/", label: "기록", icon: NotebookPen },
  { href: "/beans/", label: "원두·장비", icon: Package },
  { href: "/settings/", label: "설정", icon: Settings },
];

const norm = (p: string) => (p.endsWith("/") ? p : p + "/");

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = norm(usePathname() || "/");
  const ready = useStore((s) => s.ready);
  const error = useStore((s) => s.error);
  const showTabs = TABS.some((t) => norm(t.href) === pathname);

  useEffect(() => {
    loadAll();
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register(asset("/sw.js")).catch(() => {});
    }
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[560px] flex-col">
      <main className={`flex-1 ${showTabs ? "pb-24" : "pb-8"}`}>
        {ready ? children : <div className="p-10 text-center text-sub">불러오는 중…</div>}
      </main>

      {error && (
        <button
          onClick={clearError}
          className="fixed inset-x-4 top-4 z-50 mx-auto max-w-[520px] rounded-2xl bg-red-700 px-4 py-3 text-left text-sm text-white shadow-lg"
        >
          {error} <span className="opacity-70">(닫기)</span>
        </button>
      )}

      {showTabs && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 backdrop-blur">
          <div className="mx-auto grid max-w-[560px] grid-cols-4">
            {TABS.map(({ href, label, icon: Icon }) => {
              const on = norm(href) === pathname;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${on ? "text-espresso font-semibold" : "text-sub"}`}
                >
                  <Icon size={22} strokeWidth={on ? 2.4 : 1.8} />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
