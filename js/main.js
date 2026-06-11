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
let speechChain = 0;  // 진행 중인 음성 체인 식별자 — 새 탭/레벨이 시작되면 옛 체인은 침묵
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
  const chain = ++speechChain;
  setTimeout(() => {
    if (chain === speechChain && game.next === 1) audio.askFor(1);
  }, 600);
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
  if (!r.levelClear) render.updateTarget(game.next);

  // 음성 체인: "둘!" → (끝나면) "티라노사우루스!" → (끝나면) 다음 안내 또는 클리어.
  // 고정 타이머 대신 실제 재생 종료를 기다리므로 음성이 겹치지 않는다.
  const chain = ++speechChain;
  const isClear = r.levelClear;
  render.hatch(num, dino, async () => {
    audio.playPop();
    await audio.sayNumber(num);
    if (chain !== speechChain) return; // 새 탭/레벨이 끼어들었으면 옛 체인은 종료
    await audio.sayDino(dino);
    if (chain !== speechChain) return;
    if (isClear) {
      onLevelClear();
    } else {
      audio.askFor(game.next);
    }
  });
}

function onLevelClear() {
  progress.stars[levelIndex] = 1;
  saveProgress(progress);
  audio.playFanfare();
  setTimeout(() => audio.sayPraise(), 800); // 빵빠레(효과음, ~0.8초) 직후 칭찬
  render.showClear(hatchedDinos, levelIndex < LEVELS.length - 1);
}

// 음성 파일 등록은 페이지 로드 즉시 시작 — 시작 버튼 시점엔 이미 준비돼 있어
// 첫 안내가 폰 TTS로 새는(목소리가 둘이 되는) 일을 막는다. 재생은 제스처 이후에만 일어난다.
audio.loadVoiceFiles();

document.getElementById('start-btn').addEventListener('click', () => {
  audio.initAudio();          // 첫 사용자 제스처에서 오디오 잠금 해제
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
