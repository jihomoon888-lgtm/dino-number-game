// 게임 규칙 — DOM 없음. 순수 상태와 판정만 담당한다.
export const LEVELS = [3, 5, 10];

export function createGame(levelIndex) {
  return {
    levelIndex,
    count: LEVELS[levelIndex],
    next: 1,         // 다음에 깨야 할 숫자
    wrongStreak: 0,  // 연속 오답 수 (2가 되면 힌트)
    cleared: false,
  };
}

export function tapEgg(game, num) {
  const result = { correct: false, ignored: false, hint: false, levelClear: false };
  if (game.cleared || num < game.next) {
    result.ignored = true; // 이미 깬 알이나 클리어 후 탭은 무시
    return result;
  }
  if (num !== game.next) {
    game.wrongStreak += 1;
    result.hint = game.wrongStreak >= 2;
    return result;
  }
  game.next += 1;
  game.wrongStreak = 0;
  game.cleared = game.next > game.count;
  result.correct = true;
  result.levelClear = game.cleared;
  return result;
}

// 1..count 순열 (Fisher-Yates). rand 주입으로 테스트 가능.
export function shuffledNumbers(count, rand = Math.random) {
  const nums = Array.from({ length: count }, (_, i) => i + 1);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
}
