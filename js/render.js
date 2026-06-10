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
