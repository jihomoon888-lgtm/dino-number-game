// 오프라인 캐시 — 버전을 올리면 옛 캐시는 activate에서 제거된다.
const CACHE = 'dino-num-v5';

// 음성 파일 키: n01~n10(숫자), ask01~ask10(안내), dino01~dino10(이름), praise01
const VOICE_KEYS = [
  ...Array.from({ length: 10 }, (_, i) => `n${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 10 }, (_, i) => `ask${String(i + 1).padStart(2, '0')}`),
  ...Array.from({ length: 10 }, (_, i) => `dino${String(i + 1).padStart(2, '0')}`),
  'praise01',
];

const ASSETS = [
  ...VOICE_KEYS.map((k) => `./assets/voice/${k}.mp3`),
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/game.js',
  './js/storage.js',
  './js/audio.js',
  './js/render.js',
  './data/dinos.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/dinos/dino01.jpg',
  './assets/dinos/dino02.png',
  './assets/dinos/dino03.png',
  './assets/dinos/dino04.jpg',
  './assets/dinos/dino05.jpg',
  './assets/dinos/dino06.jpg',
  './assets/dinos/dino07.png',
  './assets/dinos/dino08.jpg',
  './assets/dinos/dino09.jpg',
  './assets/dinos/dino10.jpg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request))
  );
});
