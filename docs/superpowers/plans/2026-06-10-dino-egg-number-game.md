# 공룡알 숫자나라 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 33개월 아이가 공룡알을 1번부터 순서대로 탭해 깨면서 1~10 세기를 배우는 안드로이드용 PWA 웹앱.

**Architecture:** 빌드 도구 없는 순수 HTML/CSS/JS 단일 페이지 앱. 게임 규칙(`js/game.js`)은 DOM과 완전히 분리된 순수 모듈로 작성해 Node 내장 테스트 러너로 검증한다. 소리(`js/audio.js`)와 공룡 이미지는 "파일이 있으면 파일, 없으면 폴백(TTS/실루엣)" 구조로 교체 가능하게 한다. 서비스 워커로 오프라인 동작.

**Tech Stack:** Vanilla JS (ES Modules), SVG, Web Speech API (TTS), Web Audio API (효과음 합성), Service Worker, Node.js 내장 test runner (`node --test`), GitHub Pages.

**스펙 문서:** `docs/superpowers/specs/2026-06-10-dino-egg-number-game-design.md`

**최종 파일 구조:**

```
index.html              # 3개 화면(시작/게임/클리어)
css/style.css           # 전체 스타일 + 애니메이션
js/game.js              # 순수 게임 로직 (DOM 없음, 테스트 대상)
js/storage.js           # 진행도 저장 (localStorage 가드 포함)
js/audio.js             # TTS/음성파일/효과음 레이어
js/render.js            # DOM/SVG 렌더링과 연출
js/main.js              # 전체 연결 (이벤트, 흐름)
data/dinos.js           # 공룡 10종 이름·이미지 매핑
assets/dinos/*.png      # 리얼 공룡 이미지 (Task 8에서 수집)
assets/icons/icon-*.png # PWA 아이콘
assets/voice/           # (선택) 부모 녹음 파일 — 빈 폴더로 시작
tests/*.test.js         # node --test 단위 테스트
manifest.json, sw.js    # PWA
scripts/make-icons.ps1  # 아이콘 생성 스크립트
```

---

### Task 1: 프로젝트 뼈대 + Node 확인

**Files:**
- Create: `package.json`
- Create: `assets/voice/.gitkeep`, `assets/dinos/.gitkeep`, `assets/icons/.gitkeep`

- [ ] **Step 1: Node.js 사용 가능 확인**

Run: `node --version`
Expected: `v18.13` 이상 (예: `v20.x`, `v22.x`). 없거나 v18.13 미만이면 **중단하고 사용자에게 보고** (Node 설치 필요 — winget install OpenJS.NodeJS.LTS 제안).

- [ ] **Step 2: package.json 작성**

```json
{
  "name": "dino-num",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/"
  }
}
```

- [ ] **Step 3: 빈 에셋 폴더 생성**

Run (PowerShell):
```powershell
New-Item -ItemType Directory -Force assets/voice, assets/dinos, assets/icons, tests, js, css, data, scripts | Out-Null
New-Item -ItemType File assets/voice/.gitkeep, assets/dinos/.gitkeep, assets/icons/.gitkeep | Out-Null
```

- [ ] **Step 4: Commit**

```bash
git add package.json assets
git commit -m "chore: 프로젝트 뼈대 생성"
```

---

### Task 2: 게임 로직 `js/game.js` (TDD)

순서 판정, 힌트 트리거, 레벨 클리어를 담당하는 순수 모듈. DOM 접근 금지.

**Files:**
- Create: `js/game.js`
- Test: `tests/game.test.js`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/game.test.js`:
```js
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
  const fixed = shuffledNumbers(3, () => 0); // rand()=0이면 항상 j=0과 스왑
  assert.equal(fixed.length, 3);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module ... js/game.js`

- [ ] **Step 3: 최소 구현 작성**

`js/game.js`:
```js
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS (테스트 전부 통과)

- [ ] **Step 5: Commit**

```bash
git add js/game.js tests/game.test.js
git commit -m "feat: 게임 규칙 로직 (순서 판정, 힌트, 클리어)"
```

---

### Task 3: 진행도 저장 `js/storage.js` (TDD)

**Files:**
- Create: `js/storage.js`
- Test: `tests/storage.test.js`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/storage.test.js`:
```js
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
  const store = fakeStore();
  store.setItem('dino-num-progress', '{{{불량 데이터');
  assert.deepEqual(loadProgress(store), { stars: [0, 0, 0] });
});

test('저장소 접근이 예외를 던져도 죽지 않는다', () => {
  const broken = {
    getItem: () => { throw new Error('접근 불가'); },
    setItem: () => { throw new Error('접근 불가'); },
  };
  assert.deepEqual(loadProgress(broken), { stars: [0, 0, 0] });
  assert.doesNotThrow(() => saveProgress({ stars: [1, 0, 0] }, broken));
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module ... js/storage.js`

- [ ] **Step 3: 최소 구현 작성**

`js/storage.js`:
```js
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
      if (data && Array.isArray(data.stars) && data.stars.length === 3) return data;
    }
  } catch (e) { /* 기본값으로 진행 */ }
  return { stars: [0, 0, 0] };
}

export function saveProgress(progress, store = defaultStore()) {
  try {
    store.setItem(KEY, JSON.stringify(progress));
  } catch (e) { /* 저장 실패해도 게임은 계속 */ }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/storage.js tests/storage.test.js
git commit -m "feat: 진행도 저장 (localStorage 가드 포함)"
```

---

### Task 4: 공룡 데이터 `data/dinos.js` (TDD)

**Files:**
- Create: `data/dinos.js`
- Test: `tests/dinos.test.js`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/dinos.test.js`:
```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module ... data/dinos.js`

- [ ] **Step 3: 최소 구현 작성**

`data/dinos.js`:
```js
// 공룡 도감 — 육식 위주 + 초식 일부. 이미지는 파일만 바꾸면 교체된다.
export const DINOS = [
  { id: 'dino01', name: '티라노사우루스', file: 'assets/dinos/dino01.png' },
  { id: 'dino02', name: '벨로시랩터',     file: 'assets/dinos/dino02.png' },
  { id: 'dino03', name: '스피노사우루스', file: 'assets/dinos/dino03.png' },
  { id: 'dino04', name: '알로사우루스',   file: 'assets/dinos/dino04.png' },
  { id: 'dino05', name: '기가노토사우루스', file: 'assets/dinos/dino05.png' },
  { id: 'dino06', name: '카르노타우루스', file: 'assets/dinos/dino06.png' },
  { id: 'dino07', name: '프테라노돈',     file: 'assets/dinos/dino07.png' },
  { id: 'dino08', name: '트리케라톱스',   file: 'assets/dinos/dino08.png' },
  { id: 'dino09', name: '브라키오사우루스', file: 'assets/dinos/dino09.png' },
  { id: 'dino10', name: '스테고사우루스', file: 'assets/dinos/dino10.png' },
];

// 레벨 알 개수만큼 무작위로 중복 없이 뽑는다.
export function pickDinos(count, rand = Math.random) {
  const pool = [...DINOS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add data/dinos.js tests/dinos.test.js
git commit -m "feat: 공룡 10종 데이터와 무작위 선택"
```

---

### Task 5: 오디오 레이어 `js/audio.js`

브라우저 API(TTS, WebAudio)에 의존하므로 단위 테스트 대신 Task 7의 수동 테스트로 검증한다.

**Files:**
- Create: `js/audio.js`

- [ ] **Step 1: 구현 작성**

`js/audio.js`:
```js
// 소리 레이어 — 우선순위: 녹음 파일(assets/voice/) > TTS > 무음.
// 효과음(뽁, 빵빠레)은 WebAudio로 합성해서 파일이 필요 없다.
const NUMBER_WORDS = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];

let ctx = null;
const voiceFiles = {}; // key('n01'..'n10','praise01') -> Audio (존재 확인된 것만)

// 시작 버튼 첫 터치에서 호출 — 모바일 오디오 잠금 해제
export function initAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  if ('speechSynthesis' in window) speechSynthesis.getVoices(); // TTS 워밍업
}

// assets/voice/에 녹음 파일이 있는지 확인해서 등록 (없으면 TTS 폴백)
export async function loadVoiceFiles() {
  const keys = [...Array.from({ length: 10 }, (_, i) => `n${String(i + 1).padStart(2, '0')}`), 'praise01'];
  await Promise.all(keys.map(async (key) => {
    try {
      const res = await fetch(`assets/voice/${key}.mp3`, { method: 'HEAD' });
      if (res.ok) voiceFiles[key] = new Audio(`assets/voice/${key}.mp3`);
    } catch (e) { /* 없으면 TTS 사용 */ }
  }));
}

function tts(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = 0.85;  // 아이가 따라 말할 수 있게 약간 천천히
  u.pitch = 1.15; // 살짝 밝은 톤
  speechSynthesis.speak(u);
}

function playFileOrTts(key, text) {
  const file = voiceFiles[key];
  if (file) {
    file.currentTime = 0;
    file.play().catch(() => tts(text));
    return;
  }
  tts(text);
}

export function sayNumber(n) {
  playFileOrTts(`n${String(n).padStart(2, '0')}`, `${NUMBER_WORDS[n]}!`);
}

export function sayDino(name) {
  tts(`${name}!`);
}

export function askFor(n) {
  tts(`${NUMBER_WORDS[n]}! 어디 있을까?`);
}

export function sayPraise() {
  playFileOrTts('praise01', '우와! 알을 다 깼다! 정말 잘했어!');
}

// 알 깨지는 "뽁" 소리 (합성)
export function playPop() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(300, t);
  o.frequency.exponentialRampToValueAtTime(900, t + 0.12);
  g.gain.setValueAtTime(0.3, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.2);
}

// 클리어 빵빠레 — 도미솔도 상승 아르페지오 (합성)
export function playFanfare() {
  if (!ctx) return;
  [523, 659, 784, 1047].forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.15;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.35);
  });
}
```

- [ ] **Step 2: 문법 확인**

Run: `node --check js/audio.js`
Expected: 출력 없음 (문법 오류 없음)

- [ ] **Step 3: Commit**

```bash
git add js/audio.js
git commit -m "feat: 소리 레이어 (녹음파일 우선, TTS 폴백, 합성 효과음)"
```

---

### Task 6: 화면 — `index.html`, `css/style.css`, `js/render.js`

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/render.js`

- [ ] **Step 1: index.html 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <meta name="theme-color" content="#81c784">
  <title>공룡알 숫자나라</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="manifest" href="manifest.json">
  <link rel="icon" href="assets/icons/icon-192.png">
</head>
<body>
  <!-- 시작 화면 -->
  <section id="start-screen" class="screen active">
    <h1>🦖 공룡알 숫자나라</h1>
    <div id="stars" class="stars"></div>
    <button id="start-btn" class="big-btn">시작!</button>
  </section>

  <!-- 게임 화면 -->
  <section id="game-screen" class="screen">
    <div class="target-box"><span id="target-num">1</span></div>
    <div id="egg-field" class="egg-field"></div>
  </section>

  <!-- 클리어 화면 -->
  <section id="clear-screen" class="screen">
    <div class="celebrate">🎉 ⭐ 🎉</div>
    <div id="clear-dinos" class="clear-dinos"></div>
    <p class="praise">잘했어!</p>
    <button id="next-btn" class="big-btn">다음 레벨</button>
  </section>

  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: css/style.css 작성**

```css
/* 공룡알 숫자나라 — 33개월 손가락 기준: 터치 영역 크게, 글자 크게 */
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  height: 100%;
  font-family: 'Malgun Gothic', sans-serif;
  overflow: hidden;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

body { background: linear-gradient(#b3e5fc, #dcedc8); }

.screen {
  display: none;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4vmin;
  padding: 4vmin;
}
.screen.active { display: flex; }

h1 { font-size: 8vmin; color: #33691e; text-shadow: 0 2px 0 #fff; }

.stars { font-size: 7vmin; letter-spacing: 1vmin; }

.big-btn {
  border: none;
  background: #ff7043;
  color: #fff;
  font-size: 7vmin;
  font-weight: bold;
  font-family: inherit;
  padding: 3vmin 10vmin;
  border-radius: 100px;
  box-shadow: 0 6px 0 #d84315;
  cursor: pointer;
}
.big-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 #d84315; }

/* 게임 화면 */
.target-box {
  background: #fff;
  border-radius: 4vmin;
  padding: 1vmin 6vmin;
  box-shadow: 0 4px 10px rgba(0,0,0,.15);
}
#target-num { font-size: 14vmin; font-weight: bold; color: #ff7043; }

.egg-field {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-end;
  gap: 3vmin;
  width: 100%;
}

.egg {
  border: none;
  background: none;
  cursor: pointer;
  width: 22vmin;
  height: 28vmin;
  position: relative;
  font-family: inherit;
}
/* 알 10개(두 줄 배치)일 때는 살짝 작게 */
.egg-field.two-rows .egg { width: 16vmin; height: 21vmin; }

.egg svg { width: 100%; height: 100%; }
.egg-num { font-size: 44px; font-weight: bold; fill: #8d6e63; }

/* 오답: 도리도리 */
@keyframes wiggle {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-8deg); }
  75% { transform: rotate(8deg); }
}
.egg.wiggle { animation: wiggle .4s ease-in-out 2; }

/* 힌트: 정답 알 반짝임 */
@keyframes glow {
  0%, 100% { filter: drop-shadow(0 0 2vmin gold); transform: scale(1); }
  50% { filter: drop-shadow(0 0 5vmin orange); transform: scale(1.08); }
}
.egg.hint { animation: glow 1s ease-in-out infinite; }

/* 부화: 거세게 흔들리며 금이 보임 */
@keyframes hatch-shake {
  0%, 100% { transform: rotate(0) scale(1); }
  20% { transform: rotate(-12deg) scale(1.05); }
  40% { transform: rotate(12deg) scale(1.05); }
  60% { transform: rotate(-10deg) scale(1.1); }
  80% { transform: rotate(10deg) scale(1.1); }
}
.egg.hatching { animation: hatch-shake .7s ease-in-out; }
.egg.hatching .crack { opacity: 1 !important; }

/* 공룡 등장 */
@keyframes pop-in {
  0% { transform: scale(0); }
  70% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
.dino-img, .dino-fallback {
  width: 100%;
  height: 75%;
  object-fit: contain;
  animation: pop-in .5s cubic-bezier(.2, 1.4, .4, 1);
}
.dino-name {
  display: block;
  font-size: 2.6vmin;
  font-weight: bold;
  color: #33691e;
  white-space: nowrap;
}

@keyframes sparkle-fade {
  0% { opacity: 1; transform: scale(1.4); }
  100% { opacity: 0; transform: scale(0.6) translateY(-4vmin); }
}
.sparkle {
  position: absolute;
  top: 0; left: 50%;
  transform: translateX(-50%);
  font-size: 6vmin;
  animation: sparkle-fade 1.2s ease-out forwards;
  pointer-events: none;
}

/* 클리어 화면 */
.celebrate { font-size: 12vmin; }
.clear-dinos { display: flex; flex-wrap: wrap; justify-content: center; gap: 2vmin; }
.clear-dinos img { width: 16vmin; height: 16vmin; object-fit: contain; }
.praise { font-size: 7vmin; font-weight: bold; color: #e65100; }
```

- [ ] **Step 3: js/render.js 작성**

```js
// 렌더링 — DOM 조작과 SVG 생성만 담당. 게임 규칙은 모른다.

function eggSvg(num) {
  return `<svg viewBox="0 0 100 130" aria-hidden="true">
    <ellipse cx="50" cy="72" rx="42" ry="54" fill="#fdf6e3" stroke="#d4b483" stroke-width="4"/>
    <ellipse cx="36" cy="48" rx="11" ry="15" fill="#fff" opacity="0.75"/>
    <path class="crack" d="M18 64 L33 55 L44 68 L59 53 L71 66 L84 57"
          stroke="#a1887f" stroke-width="3" fill="none" opacity="0"/>
    <text x="50" y="88" text-anchor="middle" class="egg-num">${num}</text>
  </svg>`;
}

// 이미지 로드 실패 시 보여줄 공룡 실루엣 (티라노 모양 단순화)
function fallbackDino() {
  const div = document.createElement('div');
  div.innerHTML = `<svg class="dino-fallback" viewBox="0 0 100 100" aria-hidden="true">
    <path fill="#558b2f" d="M78 18 q14 2 14 14 q0 8 -10 9 l-6 1 -4 10 -5 22 q-2 8 -10 8 l-6 0 4 -8 -8 2 -4 8 -8 0 3 -9 q-12 2 -19 -5 q-8 -8 -4 -19 q4 -11 17 -12 l20 -2 q5 -12 16 -16 z
    M82 27 a2.5 2.5 0 1 1 0 5 a2.5 2.5 0 1 1 0 -5"/>
  </svg>`;
  return div.firstElementChild;
}

function eggEl(num) {
  return document.querySelector(`.egg[data-num="${num}"]`);
}

export function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
}

export function renderStars(stars) {
  document.getElementById('stars').textContent = stars.map((s) => (s ? '⭐' : '☆')).join(' ');
}

export function updateTarget(n) {
  document.getElementById('target-num').textContent = n;
}

export function renderEggs(numbers, onTap) {
  const field = document.getElementById('egg-field');
  field.innerHTML = '';
  field.classList.toggle('two-rows', numbers.length > 6);
  for (const num of numbers) {
    const btn = document.createElement('button');
    btn.className = 'egg';
    btn.dataset.num = num;
    btn.innerHTML = eggSvg(num);
    btn.addEventListener('click', () => onTap(num));
    field.appendChild(btn);
  }
}

export function wiggle(num) {
  const egg = eggEl(num);
  if (!egg) return;
  egg.classList.remove('wiggle');
  void egg.offsetWidth; // 애니메이션 재시작
  egg.classList.add('wiggle');
}

export function hintGlow(num) {
  eggEl(num)?.classList.add('hint');
}

// 부화 연출: 흔들림+금(0.7초) → 알 자리에 공룡 이미지 + 반짝이
export function hatch(num, dino, onShown) {
  const egg = eggEl(num);
  if (!egg) return;
  egg.classList.remove('hint', 'wiggle');
  egg.classList.add('hatching');
  setTimeout(() => {
    egg.classList.remove('hatching');
    egg.innerHTML = ''; // 부화한 알 재탭은 game.js가 ignored로 처리

    const sparkle = document.createElement('span');
    sparkle.className = 'sparkle';
    sparkle.textContent = '✨';

    const img = document.createElement('img');
    img.className = 'dino-img';
    img.src = dino.file;
    img.alt = dino.name;
    img.onerror = () => img.replaceWith(fallbackDino());

    const name = document.createElement('span');
    name.className = 'dino-name';
    name.textContent = dino.name;

    egg.append(sparkle, img, name);
    if (onShown) onShown();
  }, 700);
}

export function showClear(dinos, hasNextLevel) {
  const box = document.getElementById('clear-dinos');
  box.innerHTML = '';
  for (const d of dinos) {
    const img = document.createElement('img');
    img.src = d.file;
    img.alt = d.name;
    img.onerror = () => img.replaceWith(fallbackDino());
    box.appendChild(img);
  }
  document.getElementById('next-btn').textContent = hasNextLevel ? '다음 레벨' : '처음으로';
  showScreen('clear-screen');
}
```

- [ ] **Step 4: 문법 확인**

Run: `node --check js/render.js`
Expected: 출력 없음

- [ ] **Step 5: Commit**

```bash
git add index.html css/style.css js/render.js
git commit -m "feat: 화면 구조, 스타일, 렌더링/연출 레이어"
```

---

### Task 7: 전체 연결 `js/main.js` + 수동 플레이 테스트

**Files:**
- Create: `js/main.js`

- [ ] **Step 1: js/main.js 작성**

```js
// 전체 흐름 연결: 화면 전환, 탭 처리, 소리 타이밍.
import { LEVELS, createGame, tapEgg, shuffledNumbers } from './game.js';
import { loadProgress, saveProgress } from './storage.js';
import { pickDinos } from '../data/dinos.js';
import * as audio from './audio.js';
import * as render from './render.js';

let game = null;
let levelIndex = 0;
let dinoByNum = {};   // 숫자 -> 이번 판에 배정된 공룡
let hatchedDinos = []; // 이번 판에 부화한 공룡들 (클리어 화면용)
const progress = loadProgress();

function showStart() {
  render.renderStars(progress.stars);
  render.showScreen('start-screen');
}

function startLevel(idx) {
  levelIndex = idx;
  game = createGame(idx);
  hatchedDinos = [];
  const numbers = shuffledNumbers(game.count);
  const dinos = pickDinos(game.count);
  dinoByNum = {};
  numbers.forEach((n, i) => { dinoByNum[n] = dinos[i]; });
  render.renderEggs(numbers, onEggTap);
  render.updateTarget(1);
  render.showScreen('game-screen');
  setTimeout(() => audio.askFor(1), 600);
}

function onEggTap(num) {
  const r = tapEgg(game, num);
  if (r.ignored) return;

  if (!r.correct) {
    render.wiggle(num);
    if (r.hint) render.hintGlow(game.next);
    return;
  }

  const dino = dinoByNum[num];
  hatchedDinos.push(dino);
  render.hatch(num, dino, () => {
    audio.playPop();
    audio.sayNumber(num);
    setTimeout(() => audio.sayDino(dino.name), 900);
  });

  if (r.levelClear) {
    setTimeout(onLevelClear, 2600);
  } else {
    render.updateTarget(game.next);
  }
}

function onLevelClear() {
  progress.stars[levelIndex] = 1;
  saveProgress(progress);
  audio.playFanfare();
  setTimeout(() => audio.sayPraise(), 800);
  render.showClear(hatchedDinos, levelIndex < LEVELS.length - 1);
}

document.getElementById('start-btn').addEventListener('click', () => {
  audio.initAudio();          // 첫 사용자 제스처에서 오디오 잠금 해제
  audio.loadVoiceFiles();     // 녹음 파일 있으면 등록 (비동기, 기다리지 않음)
  let idx = progress.stars.indexOf(0); // 첫 미클리어 레벨부터
  if (idx === -1) idx = LEVELS.length - 1;
  startLevel(idx);
});

document.getElementById('next-btn').addEventListener('click', () => {
  if (levelIndex < LEVELS.length - 1) {
    startLevel(levelIndex + 1);
  } else {
    showStart();
  }
});

// 서비스 워커 등록 (Task 9에서 sw.js 생성 — 그 전엔 404로 조용히 실패해도 무방)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

showStart();
```

- [ ] **Step 2: 단위 테스트 전체 재실행**

Run: `npm test`
Expected: PASS (기존 테스트 영향 없음)

- [ ] **Step 3: 로컬 서버로 수동 플레이 테스트**

Run (백그라운드): `npx --yes http-server -p 8123 -c-1`
브라우저(Claude Preview 또는 Chrome)에서 `http://localhost:8123` 열기.

확인 체크리스트:
- 시작 화면: 제목, 별 ☆ ☆ ☆, "시작!" 버튼 표시
- 시작! 탭 → 알 3개 등장, 상단 목표 숫자 "1", 음성 "하나! 어디 있을까?"
- 틀린 알 탭 → 도리도리만 함 (아무 일 없음)
- 두 번 연속 틀림 → 정답 알이 금색으로 반짝임
- 정답 탭 → 흔들림 → 금 → 공룡 등장(이미지 없으므로 **초록 실루엣 폴백**이 떠야 정상) + "하나!" + 공룡 이름 음성
- 알 3개 다 깨면 → 빵빠레 + 클리어 화면 + "다음 레벨" 버튼
- 다음 레벨 → 알 5개. 그 다음 → 알 10개(두 줄, 알 작아짐)
- 마지막 클리어 후 "처음으로" → 시작 화면 별 ⭐ ⭐ ⭐
- 새로고침 → 별 유지(localStorage)

문제 발견 시 이 Task 안에서 수정 후 다시 확인.

- [ ] **Step 4: Commit**

```bash
git add js/main.js
git commit -m "feat: 게임 전체 흐름 연결 — 플레이 가능"
```

---

### Task 8: 리얼 공룡 이미지 수집

**Files:**
- Create: `assets/dinos/dino01.png` ~ `dino10.png`
- Create: `assets/dinos/CREDITS.md`

- [ ] **Step 1: 퍼블릭 도메인/CC0 공룡 복원도 수집**

WebSearch/WebFetch로 Wikimedia Commons 등에서 `data/dinos.js`의 10종에 맞는 복원도(restoration) 이미지를 찾아 다운로드한다.

요구 조건:
- 라이선스: Public Domain, CC0, 또는 CC-BY (출처 표기 시 사용 가능)
- 리얼한(사실적인) 복원도 — 만화풍 제외
- 각 파일을 `assets/dinos/dino01.png` ~ `dino10.png`로 저장 (jpg로만 구하면 PNG로 변환하거나, `data/dinos.js`의 `file` 값을 실제 확장자로 수정)
- 파일당 500KB 이하 권장 (폰 로딩 속도)

다운로드 예시 (PowerShell):
```powershell
Invoke-WebRequest -Uri "<이미지 URL>" -OutFile "assets/dinos/dino01.png"
```

- [ ] **Step 2: CREDITS.md 작성**

`assets/dinos/CREDITS.md`에 각 파일의 출처 URL, 작가, 라이선스를 표로 기록:

```markdown
# 공룡 이미지 출처

| 파일 | 공룡 | 출처 | 작가 | 라이선스 |
|------|------|------|------|----------|
| dino01.png | 티라노사우루스 | (URL) | (이름) | CC0 |
```

- [ ] **Step 3: 브라우저에서 확인**

로컬 서버(`http://localhost:8123`)에서 한 레벨 플레이하며 공룡 이미지가 실루엣 대신 실제 이미지로 뜨는지 확인. 깨진 이미지가 있으면 교체.

- [ ] **Step 4: Commit**

```bash
git add assets/dinos data/dinos.js
git commit -m "feat: 리얼 공룡 이미지 10종 추가 (출처 기록 포함)"
```

---

### Task 9: PWA — 아이콘, manifest.json, sw.js, 오프라인 확인

**Files:**
- Create: `scripts/make-icons.ps1`
- Create: `assets/icons/icon-192.png`, `assets/icons/icon-512.png`
- Create: `manifest.json`
- Create: `sw.js`

- [ ] **Step 1: 아이콘 생성 스크립트 작성·실행**

`scripts/make-icons.ps1`:
```powershell
# 알 모양 PWA 아이콘 생성 (System.Drawing 사용)
Add-Type -AssemblyName System.Drawing
foreach ($size in 192, 512) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear([System.Drawing.Color]::FromArgb(255, 129, 199, 132))
  $w = $size * 0.62; $h = $size * 0.78
  $x = ($size - $w) / 2; $y = $size * 0.11
  $g.FillEllipse([System.Drawing.Brushes]::Ivory, $x, $y, $w, $h)
  $font = New-Object System.Drawing.Font('Arial', ($size * 0.22), [System.Drawing.FontStyle]::Bold)
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = 'Center'; $fmt.LineAlignment = 'Center'
  $rect = New-Object System.Drawing.RectangleF(0, ($size * 0.08), $size, $size)
  $g.DrawString('123', $font, [System.Drawing.Brushes]::Coral, $rect, $fmt)
  $g.Dispose()
  $bmp.Save("assets/icons/icon-$size.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}
Write-Output "아이콘 생성 완료"
```

Run: `powershell -ExecutionPolicy Bypass -File scripts/make-icons.ps1`
Expected: `아이콘 생성 완료`, `assets/icons/`에 PNG 2개 생성

- [ ] **Step 2: manifest.json 작성**

```json
{
  "name": "공룡알 숫자나라",
  "short_name": "공룡숫자",
  "description": "공룡알을 순서대로 깨면서 1~10을 배워요",
  "start_url": "./",
  "scope": "./",
  "display": "fullscreen",
  "orientation": "any",
  "background_color": "#b3e5fc",
  "theme_color": "#81c784",
  "lang": "ko",
  "icons": [
    { "src": "assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 3: sw.js 작성**

주의: `ASSETS`의 dino 파일 확장자는 Task 8 결과(`data/dinos.js`)와 일치시킬 것.

```js
// 오프라인 캐시 — 버전을 올리면 옛 캐시는 activate에서 제거된다.
const CACHE = 'dino-num-v1';
const ASSETS = [
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
  './assets/dinos/dino01.png',
  './assets/dinos/dino02.png',
  './assets/dinos/dino03.png',
  './assets/dinos/dino04.png',
  './assets/dinos/dino05.png',
  './assets/dinos/dino06.png',
  './assets/dinos/dino07.png',
  './assets/dinos/dino08.png',
  './assets/dinos/dino09.png',
  './assets/dinos/dino10.png',
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
```

- [ ] **Step 4: 오프라인 동작 확인**

1. 로컬 서버에서 페이지 열기 → DevTools Application 탭에서 서비스 워커 등록 확인
2. DevTools Network 탭 → "Offline" 체크 → 새로고침 → 게임이 정상 로드되고 플레이 가능해야 함
3. manifest 경고가 없는지 Application > Manifest에서 확인

- [ ] **Step 5: Commit**

```bash
git add manifest.json sw.js scripts/make-icons.ps1 assets/icons
git commit -m "feat: PWA 지원 — 아이콘, 매니페스트, 오프라인 캐시"
```

---

### Task 10: 최종 검증 + GitHub Pages 배포

**Files:**
- Create: `README.md`

- [ ] **Step 1: 전체 테스트 + 전체 플레이 최종 확인**

Run: `npm test` → Expected: PASS
로컬 서버에서 레벨 1→2→3 전체 플레이 1회 (Task 7 체크리스트 항목 전부).

- [ ] **Step 2: README.md 작성**

```markdown
# 🦖 공룡알 숫자나라

33개월 아이를 위한 숫자 학습 게임. 공룡알을 1번부터 순서대로 탭해서 깨면
리얼 공룡이 나와요. (부모와 함께 플레이하는 용도)

## 폰에 설치하기
1. 안드로이드 크롬에서 게임 주소 열기
2. 메뉴(⋮) → "홈 화면에 추가"
3. 홈 화면 아이콘으로 실행 (인터넷 없어도 동작)

## 목소리 바꾸기 (선택)
`assets/voice/`에 mp3 파일을 넣으면 TTS 대신 재생됩니다:
- `n01.mp3` ~ `n10.mp3` — "하나!" ~ "열!"
- `praise01.mp3` — 클리어 칭찬 ("우와! 잘했어!" 등)

## 공룡 이미지 바꾸기 (선택)
`assets/dinos/dino01.png` ~ `dino10.png`를 같은 파일명으로 교체하면 됩니다.
이름 매핑은 `data/dinos.js`에서 수정.

## 개발
- 로컬 실행: `npx http-server -p 8123 -c-1`
- 테스트: `npm test`
- 파일을 바꾸면 `sw.js`의 `CACHE` 버전을 올려야 폰에 반영됩니다.
```

- [ ] **Step 3: 사용자 확인 후 GitHub 배포**

**반드시 사용자에게 먼저 물어볼 것** (GitHub에 올리는 것은 사용자가 승인해야 함):
- 저장소 이름 제안: `dino-number-game` (공개 저장소여야 무료 GitHub Pages 사용 가능)

승인받으면:
```bash
gh auth status   # gh CLI 로그인 확인. 안 되어 있으면 gh auth login 안내
gh repo create dino-number-game --public --source=. --push
gh api -X POST repos/{owner}/dino-number-game/pages -f "source[branch]=master" -f "source[path]=/"
```
(`gh` CLI가 없으면: 사용자에게 github.com에서 저장소 생성 → Settings > Pages > Deploy from branch 설정을 안내)

- [ ] **Step 4: 폰에서 최종 확인 안내**

배포 URL(`https://<계정>.github.io/dino-number-game/`)을 사용자에게 전달하고 확인 요청:
- 폰 크롬에서 열기 → 소리 나는지 (TTS 한국어)
- "홈 화면에 추가" → 아이콘 생성 → 전체화면 실행
- 비행기 모드에서 실행 → 오프라인 동작

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: README — 설치·교체 가이드"
```
