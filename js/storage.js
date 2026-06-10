// 진행도 저장 — localStorage 불가 환경(시크릿 모드 등)에서도 게임은 동작해야 한다.
const KEY = 'dino-num-progress';

function defaultStore() {
  // 저장소 전면 차단 모드에선 localStorage 접근만으로 예외가 날 수 있다.
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch (e) { /* 아래 무동작 저장소로 폴백 */ }
  return { getItem: () => null, setItem: () => {} };
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
