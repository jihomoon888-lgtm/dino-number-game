import test from 'node:test';
import assert from 'node:assert/strict';
import { DINOS, pickDinos } from '../data/dinos.js';

test('공룡은 정확히 10종', () => {
  assert.equal(DINOS.length, 10);
});

test('모든 공룡은 id, name, file을 가진다', () => {
  for (const d of DINOS) {
    assert.ok(d.id && d.name && d.file, `${JSON.stringify(d)} 필드 누락`);
    assert.match(d.file, /^assets\/dinos\//);
  }
});

test('id는 중복이 없다', () => {
  const ids = new Set(DINOS.map((d) => d.id));
  assert.equal(ids.size, DINOS.length);
});

test('pickDinos(n)은 중복 없는 n마리를 돌려준다', () => {
  const picked = pickDinos(5);
  assert.equal(picked.length, 5);
  assert.equal(new Set(picked.map((d) => d.id)).size, 5);
});

test('pickDinos(10)은 전체를 돌려준다', () => {
  assert.equal(pickDinos(10).length, 10);
});
