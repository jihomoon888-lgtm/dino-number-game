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
  const pad = (i) => String(i + 1).padStart(2, '0');
  const keys = [
    ...Array.from({ length: 10 }, (_, i) => `n${pad(i)}`),     // 숫자: "둘!"
    ...Array.from({ length: 10 }, (_, i) => `ask${pad(i)}`),   // 안내: "둘! 찾아보세요. 둘!"
    ...Array.from({ length: 10 }, (_, i) => `dino${pad(i)}`),  // 공룡 이름
    'praise01',
  ];
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

export function sayDino(dino) {
  playFileOrTts(dino.id, `${dino.name}!`);
}

export function askFor(n) {
  const word = NUMBER_WORDS[n];
  playFileOrTts(`ask${String(n).padStart(2, '0')}`, `${word}! 찾아보세요. ${word}!`);
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
