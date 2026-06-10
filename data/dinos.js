// 공룡 도감 — 육식 위주 + 초식 일부. 이미지는 파일만 바꾸면 교체된다.
export const DINOS = [
  { id: 'dino01', name: '티라노사우루스', file: 'assets/dinos/dino01.jpg' },
  { id: 'dino02', name: '벨로시랩터',     file: 'assets/dinos/dino02.png' },
  { id: 'dino03', name: '스피노사우루스', file: 'assets/dinos/dino03.png' },
  { id: 'dino04', name: '알로사우루스',   file: 'assets/dinos/dino04.jpg' },
  { id: 'dino05', name: '기가노토사우루스', file: 'assets/dinos/dino05.jpg' },
  { id: 'dino06', name: '카르노타우루스', file: 'assets/dinos/dino06.jpg' },
  { id: 'dino07', name: '프테라노돈',     file: 'assets/dinos/dino07.png' },
  { id: 'dino08', name: '트리케라톱스',   file: 'assets/dinos/dino08.jpg' },
  { id: 'dino09', name: '브라키오사우루스', file: 'assets/dinos/dino09.jpg' },
  { id: 'dino10', name: '스테고사우루스', file: 'assets/dinos/dino10.jpg' },
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
