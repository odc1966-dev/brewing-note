// 오프라인 지원: 페이지는 네트워크 우선(실패하면 캐시), 정적 파일은 캐시 우선.
// 배포할 때마다 VERSION 을 올리면 이전 캐시가 정리된다.
const VERSION = "bn-v5";
const SCOPE = self.registration.scope; // 하위 주소 배포도 지원

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) =>
        c.addAll(["", "records/", "beans/", "settings/", "brew/", "brew/edit/", "cafe/", "cafe/edit/", "beans/edit/", "gear/edit/"].map((p) => SCOPE + p)),
      )
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith(SCOPE)) return;

  if (req.mode === "navigate") {
    // ?id= 같은 검색어는 무시하고 같은 페이지 캐시를 쓴다
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req.url.split("?")[0], copy));
          return res;
        })
        .catch(() => caches.match(req.url.split("?")[0]).then((r) => r || caches.match(SCOPE))),
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
