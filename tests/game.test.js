import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, createGame, tapEgg, shuffledNumbers } from '../js/game.js';

test('레벨 구성은 3, 5, 10', () => {
  assert.deepEqual(LEVELS, [3, 5, 10]);
});

test('1부터 순서대로 탭하면 correct, 마지막 알에서 levelClear', () => {
  const g = createGame(0); // 알 3개
  assert.deepEqual(tapEgg(g, 1), { correct: true, ignored: false, hint: false, levelClear: false });
  assert.deepEqual(tapEgg(g, 2), { correct: true, ignored: false, hint: false, levelClear: false });
  assert.deepEqual(tapEgg(g, 3), { correct: true, ignored: false, hint: false, levelClear: true });
  assert.equal(g.cleared, true);
});

test('순서가 틀린 탭은 correct=false, 2연속 틀리면 hint=true', () => {
  const g = createGame(0);
  const first = tapEgg(g, 3);
  assert.equal(first.correct, false);
  assert.equal(first.hint, false);        // 오답 1회: 아직 힌트 없음
  assert.equal(tapEgg(g, 2).hint, true);  // 오답 2회 연속 → 힌트
});

test('정답을 맞히면 오답 연속 카운트가 리셋된다', () => {
  const g = createGame(0);
  tapEgg(g, 2);            // 오답 1
  tapEgg(g, 1);            // 정답
  assert.equal(tapEgg(g, 3).hint, false); // 리셋됐으므로 다시 오답 1회째
});

test('이미 깬 알을 다시 탭하면 ignored=true', () => {
  const g = createGame(0);
  tapEgg(g, 1);
  const r = tapEgg(g, 1);
  assert.equal(r.ignored, true);
  assert.equal(r.correct, false);
});

test('클리어 후의 탭은 모두 ignored', () => {
  const g = createGame(0);
  tapEgg(g, 1); tapEgg(g, 2); tapEgg(g, 3);
  assert.equal(tapEgg(g, 3).ignored, true);
});

test('shuffledNumbers는 1..n의 순열을 돌려준다', () => {
  const nums = shuffledNumbers(10);
  assert.equal(nums.length, 10);
  assert.deepEqual([...nums].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test('shuffledNumbers는 주입한 난수 함수를 사용한다 (결정적 테스트)', () => {
  // rand()=0이면 항상 j=0과 스왑: [1,2,3] → [3,2,1] → [2,3,1]
  assert.deepEqual(shuffledNumbers(3, () => 0), [2, 3, 1]);
});
