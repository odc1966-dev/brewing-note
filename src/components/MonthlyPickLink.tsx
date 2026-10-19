import { ExternalLink } from "lucide-react";

// 외부 사이트로 연결만 한다(데이터를 가져오지 않음). 운영자 허락 없이 내용을 긁어 오지 않기로 함.
const PICK_URL = "https://oh-my-unspecialty.pages.dev/";

/** 언스페셜티 월픽 플레이버휠(외부 사이트) 바로 가기 */
export function MonthlyPickLink({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href={PICK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex min-h-12 items-center gap-2 rounded-xl border border-line bg-card px-3 active:bg-cream ${compact ? "mt-2" : "mt-3"}`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">언스페셜티 월픽에서 보기</span>
        <span className="block truncate text-xs text-sub">이번 달 원두를 컵노트로 찾아보기 · 외부 사이트</span>
      </span>
      <ExternalLink size={16} className="shrink-0 text-sub" />
    </a>
  );
}
