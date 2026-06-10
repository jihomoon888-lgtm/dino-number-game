// 진행도 저장 — localStorage 불가 환경(시크릿 모드 등)에서도 게임은 동작해야 한다.
const KEY = 'dino-num-progress';

function defaultStore() {
  return typeof localStorage !== 'undefined'
    ? localStorage
    : { getItem: () => null, setItem: () => {} };
}

export function loadProgress(store = defaultStore()) {
  try {
    const raw = store.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.stars) && data.stars.length === 3
          && data.stars.every((v) => Number.isInteger(v) && v >= 0 && v <= 1)) return data;
    }
  } catch (e) { /* 기본값으로 진행 */ }
  return { stars: [0, 0, 0] };
}

export function saveProgress(progress, store = defaultStore()) {
  try {
    store.setItem(KEY, JSON.stringify(progress));
  } catch (e) { /* 저장 실패해도 게임은 계속 */ }
}
