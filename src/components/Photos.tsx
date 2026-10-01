"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { deletePhotos, photoURL, putPhoto } from "@/lib/store";
import { shrinkPhoto } from "@/lib/photo";

export const MAX_PHOTOS = 3;

function useURLs(ids: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = ids.join(",");
  useEffect(() => {
    let alive = true;
    Promise.all(ids.map(async (id) => [id, await photoURL(id)] as const)).then((pairs) => {
      if (alive) setUrls(Object.fromEntries(pairs.filter((p) => p[1]) as [string, string][]));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return urls;
}

/** 전체 화면으로 사진 보기 */
function Viewer({ url, onClose }: { url: string | null; onClose: () => void }) {
  if (!url) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3" onClick={onClose}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="사진 크게 보기" className="max-h-full max-w-full rounded-lg object-contain" />
      <button aria-label="닫기" className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white">
        <X size={24} />
      </button>
    </div>
  );
}

/** 기록 화면용: 추가·삭제 */
export function PhotoPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const urls = useURLs(value);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [view, setView] = useState<string | null>(null);

  async function add(files: FileList) {
    setBusy(true);
    setErr("");
    const ids = [...value];
    try {
      for (const f of Array.from(files).slice(0, MAX_PHOTOS - value.length)) {
        ids.push(await putPhoto(await shrinkPhoto(f)));
      }
    } catch {
      setErr("사진을 불러오지 못했어요. 다른 사진으로 해 보세요.");
    }
    onChange(ids);
    setBusy(false);
  }

  return (
    <div>
      <div className="flex gap-2">
        {value.map((id) => (
          <div key={id} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-line bg-cream">
            {urls[id] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urls[id]} alt="첨부한 사진" className="h-full w-full object-cover" onClick={() => setView(urls[id])} />
            )}
            <button
              type="button"
              aria-label="사진 빼기"
              onClick={() => onChange(value.filter((x) => x !== id))}
              className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/55 text-white"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        {value.length < MAX_PHOTOS && (
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-accent text-sm text-accent disabled:opacity-50"
          >
            <Camera size={22} />
            {busy ? "넣는 중…" : `사진 ${value.length}/${MAX_PHOTOS}`}
          </button>
        )}
      </div>
      {err && <p className="mt-1 px-1 text-xs text-red-700">{err}</p>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) add(e.target.files);
          e.target.value = "";
        }}
      />
      <Viewer url={view} onClose={() => setView(null)} />
    </div>
  );
}

/** 보기 화면용 */
export function PhotoStrip({ ids }: { ids: string[] }) {
  const urls = useURLs(ids);
  const [view, setView] = useState<string | null>(null);
  if (!ids.length) return null;
  return (
    <>
      <div className={`grid gap-2 ${ids.length === 1 ? "grid-cols-1" : ids.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {ids.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => urls[id] && setView(urls[id])}
            className={`overflow-hidden rounded-2xl border border-line bg-cream ${ids.length === 1 ? "aspect-[4/3]" : "aspect-square"}`}
          >
            {urls[id] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urls[id]} alt="기록 사진" className="h-full w-full object-cover" />
            )}
          </button>
        ))}
      </div>
      <Viewer url={view} onClose={() => setView(null)} />
    </>
  );
}

/**
 * 편집 중 사진 상태. 저장하지 않고 나가면 새로 넣은 사진을 지우고,
 * 저장하면 기록에서 뺀 사진을 지운다(다른 기록이 쓰는 사진은 보존).
 */
export function useDraftPhotos(initial: string[]) {
  const [photos, setPhotos] = useState(initial);
  const ref = useRef({ initial, photos, committed: false });
  ref.current.photos = photos;
  useEffect(
    () => () => {
      const r = ref.current;
      if (!r.committed) deletePhotos(r.photos.filter((id) => !r.initial.includes(id)));
    },
    [],
  );
  /** upsert 한 뒤에 부른다 */
  const commit = () => {
    ref.current.committed = true;
    deletePhotos(ref.current.initial.filter((id) => !ref.current.photos.includes(id)));
  };
  return [photos, setPhotos, commit] as const;
}
