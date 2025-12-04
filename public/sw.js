const CACHE_NAME = "teacher-report-app-v6";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json"
];

// تثبيت Service Worker وتخزين الملفات في الذاكرة المؤقتة
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// جلب الموارد من الذاكرة المؤقتة أولاً، ثم من الشبكة
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // إذا كان الطلب موجود في الذاكرة المؤقتة، قم بإرجاعه
        if (response) {
          return response;
        }

        // خلاف ذلك، قم بجلب الطلب من الشبكة
        return fetch(event.request);
      })
  );
});

// تحديث Service Worker وحذف الذاكرة المؤقتة القديمة
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
});
