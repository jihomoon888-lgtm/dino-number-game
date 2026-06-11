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
    // 부화 음성("둘! 티라노사우루스!")이 끝난 뒤 다음 숫자를 안내한다.
    const nextNum = game.next;
    setTimeout(() => {
      if (game.next === nextNum && !game.cleared) audio.askFor(nextNum);
    }, 3000);
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
