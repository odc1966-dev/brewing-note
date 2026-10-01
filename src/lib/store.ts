"use client";

// 기기 안 저장소. 시작할 때 IndexedDB 전체를 메모리로 읽고,
// 바뀔 때마다 메모리 → IndexedDB 순서로 저장한다(기록 수천 건 규모까지 충분).
import { useSyncExternalStore } from "react";
import type { Bean, Brew, CafeLog, DataShape, Gear, Settings } from "./types";

const DB_NAME = "brewing-note";
const DB_VERSION = 2; // 2: photos 저장소 추가
const LISTS = ["beans", "gear", "brews", "cafes"] as const;
type ListName = (typeof LISTS)[number];
type ItemOf<K extends ListName> = DataShape[K][number];

export const DEFAULT_SETTINGS: Settings = { nickname: "", defaultMethod: "핸드드립", defaultTemp: 92 };

interface State extends DataShape {
  ready: boolean;
  error: string | null;
}

let state: State = { beans: [], gear: [], brews: [], cafes: [], settings: DEFAULT_SETTINGS, ready: false, error: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  emit();
};

let dbPromise: Promise<IDBDatabase> | null = null;
function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const n of LISTS) if (!db.objectStoreNames.contains(n)) db.createObjectStore(n, { keyPath: "id" });
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
        if (!db.objectStoreNames.contains("photos")) db.createObjectStore("photos"); // key=id, value=Blob
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

const done = (tx: IDBTransaction) =>
  new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error);
  });

const reqP = <T>(r: IDBRequest<T>) =>
  new Promise<T>((res, rej) => {
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });

async function sweepOrphanPhotos(db: IDBDatabase) {
  const keys = (await reqP(db.transaction("photos").objectStore("photos").getAllKeys())) as string[];
  const used = new Set([...state.brews, ...state.cafes].flatMap((x) => x.photos ?? []));
  const orphans = keys.filter((k) => !used.has(k));
  if (!orphans.length) return;
  const tx = db.transaction("photos", "readwrite");
  for (const k of orphans) tx.objectStore("photos").delete(k);
  await done(tx);
}

let loading = false;
export async function loadAll() {
  if (state.ready || loading) return;
  loading = true;
  try {
    const db = await openDB();
    const tx = db.transaction([...LISTS, "meta"], "readonly");
    const [beans, gear, brews, cafes, settings] = await Promise.all([
      reqP(tx.objectStore("beans").getAll()),
      reqP(tx.objectStore("gear").getAll()),
      reqP(tx.objectStore("brews").getAll()),
      reqP(tx.objectStore("cafes").getAll()),
      reqP(tx.objectStore("meta").get("settings")),
    ]);
    set({
      beans: beans as Bean[],
      gear: gear as Gear[],
      brews: brews as Brew[],
      cafes: cafes as CafeLog[],
      settings: { ...DEFAULT_SETTINGS, ...(settings as Settings | undefined) },
      ready: true,
    });
    // 편집 중에 앱을 닫아 남은 사진(어느 기록에도 없는 것)을 정리
    sweepOrphanPhotos(db).catch(() => {});
    // 저장 공간이 브라우저에 의해 지워지지 않도록 요청(지원하는 브라우저만)
    navigator.storage?.persist?.().catch(() => {});
  } catch (e) {
    set({ ready: true, error: "저장소를 열 수 없습니다. 비공개 창이거나 저장이 막혀 있을 수 있어요." });
    console.error(e);
  } finally {
    loading = false;
  }
}

async function persist(name: ListName | "meta", fn: (s: IDBObjectStore) => void) {
  try {
    const db = await openDB();
    const tx = db.transaction(name, "readwrite");
    fn(tx.objectStore(name));
    await done(tx);
  } catch (e) {
    console.error(e);
    set({ error: "저장에 실패했습니다. 저장 공간을 확인해 주세요." });
  }
}

export function upsert<K extends ListName>(name: K, item: ItemOf<K>) {
  const list = state[name] as ItemOf<K>[];
  const i = list.findIndex((x) => x.id === item.id);
  const next = i >= 0 ? list.map((x, j) => (j === i ? item : x)) : [...list, item];
  set({ [name]: next } as Partial<State>);
  return persist(name, (s) => s.put(item));
}

export function remove(name: ListName, id: string) {
  const item = (state[name] as { id: string; photos?: string[] }[]).find((x) => x.id === id);
  set({ [name]: (state[name] as { id: string }[]).filter((x) => x.id !== id) } as Partial<State>);
  if (item?.photos?.length) deletePhotos(item.photos);
  return persist(name, (s) => s.delete(id));
}

// ---------- 사진 (Blob 은 메모리에 올리지 않고 필요할 때 읽는다) ----------
export async function putPhoto(blob: Blob) {
  const id = "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const db = await openDB();
  const tx = db.transaction("photos", "readwrite");
  tx.objectStore("photos").put(blob, id);
  await done(tx);
  return id;
}

const urlCache = new Map<string, string>();
export async function photoURL(id: string) {
  const hit = urlCache.get(id);
  if (hit) return hit;
  const db = await openDB();
  const blob = (await reqP(db.transaction("photos").objectStore("photos").get(id))) as Blob | undefined;
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}

export async function getPhotoBlob(id: string) {
  const db = await openDB();
  return (await reqP(db.transaction("photos").objectStore("photos").get(id))) as Blob | undefined;
}

/** 어떤 기록에서도 쓰지 않는 사진만 지운다 */
export async function deletePhotos(ids: string[]) {
  const used = new Set([...state.brews, ...state.cafes].flatMap((x) => x.photos ?? []));
  const gone = ids.filter((id) => !used.has(id));
  if (!gone.length) return;
  const db = await openDB();
  const tx = db.transaction("photos", "readwrite");
  for (const id of gone) {
    tx.objectStore("photos").delete(id);
    const u = urlCache.get(id);
    if (u) URL.revokeObjectURL(u), urlCache.delete(id);
  }
  await done(tx);
}

const blobToDataURL = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(b);
  });

export function saveSettings(patch: Partial<Settings>) {
  const settings = { ...state.settings, ...patch };
  set({ settings });
  return persist("meta", (s) => s.put(settings, "settings"));
}

export function clearError() {
  set({ error: null });
}

// ---------- 백업 ----------
export const BACKUP_FORMAT = "brewing-note-backup";

export async function exportData(withPhotos = true) {
  const { beans, gear, brews, cafes, settings } = state;
  const photos: Record<string, string> = {};
  if (withPhotos) {
    for (const id of new Set([...brews, ...cafes].flatMap((x) => x.photos ?? []))) {
      const b = await getPhotoBlob(id);
      if (b) photos[id] = await blobToDataURL(b);
    }
  }
  return { format: BACKUP_FORMAT, version: 2, exportedAt: new Date().toISOString(), beans, gear, brews, cafes, settings, photos };
}

/** 백업 파일로 전체를 바꾼다(기존 기록은 지워짐). */
export async function importData(raw: unknown) {
  const d = raw as Partial<DataShape> & { format?: string; photos?: Record<string, string> };
  if (!d || d.format !== BACKUP_FORMAT || !Array.isArray(d.brews)) throw new Error("Brewing note 백업 파일이 아닙니다.");
  const data: DataShape = {
    beans: d.beans ?? [],
    gear: d.gear ?? [],
    brews: d.brews ?? [],
    cafes: d.cafes ?? [],
    settings: { ...DEFAULT_SETTINGS, ...d.settings },
  };
  const db = await openDB();
  // 사진: data URL → Blob (트랜잭션 밖에서 미리 변환)
  const photoBlobs: [string, Blob][] = [];
  for (const [id, url] of Object.entries(d.photos ?? {})) {
    try {
      photoBlobs.push([id, await (await fetch(url)).blob()]);
    } catch {
      /* 깨진 사진은 건너뜀 */
    }
  }
  const tx = db.transaction([...LISTS, "meta", "photos"], "readwrite");
  tx.objectStore("photos").clear();
  for (const [id, b] of photoBlobs) tx.objectStore("photos").put(b, id);
  for (const n of LISTS) {
    const s = tx.objectStore(n);
    s.clear();
    for (const item of data[n]) s.put(item);
  }
  tx.objectStore("meta").put(data.settings, "settings");
  await done(tx);
  set({ ...data });
  urlCache.forEach((u) => URL.revokeObjectURL(u));
  urlCache.clear();
  return { beans: data.beans.length, brews: data.brews.length, cafes: data.cafes.length, photos: photoBlobs.length };
}

export async function wipeAll() {
  const db = await openDB();
  const tx = db.transaction([...LISTS, "meta", "photos"], "readwrite");
  for (const n of [...LISTS, "meta", "photos"] as const) tx.objectStore(n).clear();
  await done(tx);
  set({ beans: [], gear: [], brews: [], cafes: [], settings: DEFAULT_SETTINGS });
}

// ---------- React ----------
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const serverSnap: State = { ...state };

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(serverSnap));
}
