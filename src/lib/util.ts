export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

/** 로컬 시간 기준 YYYY-MM-DD */
export function today(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function daysBetween(from: string, to = today()) {
  if (!from) return null;
  const a = new Date(from + "T00:00:00").getTime();
  const b = new Date(to + "T00:00:00").getTime();
  if (Number.isNaN(a)) return null;
  return Math.round((b - a) / 86400000);
}

/** 로스팅 후 경과일 → 상태 (일반적인 필터 커피 기준의 대략적인 구간) */
export function freshness(roastDate: string) {
  const d = daysBetween(roastDate);
  if (d === null) return null;
  if (d < 0) return { days: d, label: "로스팅 예정", tone: "rest" as const };
  if (d <= 3) return { days: d, label: "디개싱 중", tone: "rest" as const };
  if (d <= 30) return { days: d, label: "맛있을 때", tone: "best" as const };
  return { days: d, label: "오래됨", tone: "old" as const };
}

export function ratio(dose: number | null, water: number | null) {
  if (!dose || !water) return null;
  return `1 : ${(water / dose).toFixed(1).replace(/\.0$/, "")}`;
}

/** 항상 m:ss (푸어 시각 표시용) */
export const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

export function fmtTime(sec: number | null) {
  if (sec === null || sec === undefined) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m ? `${m}:${String(s).padStart(2, "0")}` : `${s}초`;
}

/** "2:30", "150", "2분30초" → 초 */
export function parseTime(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const mmss = t.match(/^(\d+)\s*[:분]\s*(\d{1,2})?\s*초?$/);
  if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2] ?? 0);
  const n = Number(t.replace(/초$/, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
}

export function fmtDate(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  if (!y) return d;
  const w = "일월화수목금토"[new Date(y, m - 1, day).getDay()];
  return `${m}월 ${day}일 (${w})`;
}

export const num = (v: string): number | null => {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
