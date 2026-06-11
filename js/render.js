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

export function updateLevelNav(levelIndex) {
  document.querySelectorAll('#level-nav button').forEach((btn) => {
    btn.classList.toggle('current', Number(btn.dataset.level) === levelIndex);
  });
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

// 부화 연출 1단계: 흔들림+금(0.7초) → 알을 비우고 콜백 (공룡은 오버레이가 크게 보여준다)
export function hatch(num, dino, onCracked) {
  const egg = eggEl(num);
  if (!egg) return;
  egg.classList.remove('hint', 'wiggle');
  egg.classList.add('hatching');
  setTimeout(() => {
    egg.classList.remove('hatching');
    egg.innerHTML = ''; // 부화한 알 재탭은 game.js가 ignored로 처리
    if (onCracked) onCracked();
  }, 700);
}

// 알 자리에 작은 공룡 + 이름을 넣는다 (부화 연출의 최종 상태)
function placeDinoInEgg(num, dino) {
  const egg = eggEl(num);
  if (!egg) return;
  egg.innerHTML = '';

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
}

// ── 부화 공룡 크게 보여주기 ──────────────────────────────────
let pendingReveal = null; // 화면 가운데 떠 있는 공룡 { num, dino }

// 부화 연출 2단계: 공룡을 화면 가운데에 크게 등장시킨다.
// 직전 공룡이 아직 떠 있으면(빠른 연타) 즉시 제자리로 정리한다.
export function showDinoReveal(num, dino) {
  if (pendingReveal) placeDinoInEgg(pendingReveal.num, pendingReveal.dino);
  pendingReveal = { num, dino };

  const overlay = document.getElementById('dino-reveal');
  const img = overlay.querySelector('.reveal-img');
  const name = overlay.querySelector('.reveal-name');
  img.classList.remove('pop-big');
  img.style.transition = 'none';
  img.style.transform = '';
  img.onerror = () => { // 이미지가 없으면 큰 연출 생략, 알 자리 폴백(실루엣)으로 직행
    const p = pendingReveal;
    cancelReveal();
    if (p) placeDinoInEgg(p.num, p.dino);
  };
  img.src = dino.file;
  img.alt = dino.name;
  name.textContent = dino.name;
  name.style.opacity = '';
  overlay.classList.add('active');
  void img.offsetWidth; // 애니메이션 재시작
  img.classList.add('pop-big');
}

// 부화 연출 3단계: 큰 공룡이 줄어들며 자기 알 자리로 날아간다. 끝나면 resolve.
export function returnDinoToEgg() {
  return new Promise((resolve) => {
    if (!pendingReveal) { resolve(); return; }
    const mine = pendingReveal;
    const { num, dino } = mine;
    const overlay = document.getElementById('dino-reveal');
    const img = overlay.querySelector('.reveal-img');
    const egg = eggEl(num);

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      // 그 사이 레벨 전환(cancelReveal) 등이 끼어들었다면 배치하지 않는다
      if (pendingReveal === mine) {
        placeDinoInEgg(num, dino);
        overlay.classList.remove('active');
        img.style.transition = 'none';
        img.style.transform = '';
        pendingReveal = null;
      }
      resolve();
    };

    if (!egg) { finish(); return; }
    const ir = img.getBoundingClientRect();
    const er = egg.getBoundingClientRect();
    if (!ir.width || !er.width) { finish(); return; }
    const dx = (er.left + er.width / 2) - (ir.left + ir.width / 2);
    const dy = (er.top + er.height / 2) - (ir.top + ir.height / 2);
    const scale = Math.max(er.width / ir.width, 0.05);

    overlay.querySelector('.reveal-name').style.opacity = '0';
    img.classList.remove('pop-big');
    img.style.transition = 'transform .6s cubic-bezier(.5, 0, .4, 1)';
    img.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    img.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 750); // transitionend 미발화 대비
  });
}

// 레벨 전환 등으로 연출을 중단해야 할 때: 오버레이만 닫는다 (알 배치는 건드리지 않음)
export function cancelReveal() {
  const overlay = document.getElementById('dino-reveal');
  overlay.classList.remove('active');
  const img = overlay.querySelector('.reveal-img');
  img.style.transition = 'none';
  img.style.transform = '';
  pendingReveal = null;
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
