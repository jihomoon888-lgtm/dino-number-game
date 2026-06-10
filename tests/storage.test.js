import test from 'node:test';
import assert from 'node:assert/strict';
import { loadProgress, saveProgress } from '../js/storage.js';

function fakeStore() {
  const data = {};
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
  };
}

test('저장된 게 없으면 별 0개 기본값', () => {
  assert.deepEqual(loadProgress(fakeStore()), { stars: [0, 0, 0] });
});

test('저장하고 다시 읽으면 같은 값', () => {
  const store = fakeStore();
  saveProgress({ stars: [1, 1, 0] }, store);
  assert.deepEqual(loadProgress(store), { stars: [1, 1, 0] });
});

test('저장소가 깨진 JSON을 돌려줘도 기본값으로 복구', () => {
  const broken = { getItem: () => '{{{불량 데이터', setItem: () => {} };
  assert.deepEqual(loadProgress(broken), { stars: [0, 0, 0] });
});

test('stars 요소가 숫자가 아니면 기본값으로 복구', () => {
  const broken = { getItem: () => JSON.stringify({ stars: ['x', null, {}] }), setItem: () => {} };
  assert.deepEqual(loadProgress(broken), { stars: [0, 0, 0] });
});

test('저장소 접근이 예외를 던져도 죽지 않는다', () => {
  const broken = {
    getItem: () => { throw new Error('접근 불가'); },
    setItem: () => { throw new Error('접근 불가'); },
  };
  assert.deepEqual(loadProgress(broken), { stars: [0, 0, 0] });
  assert.doesNotThrow(() => saveProgress({ stars: [1, 0, 0] }, broken));
});
