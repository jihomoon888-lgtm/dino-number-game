# 공룡알 숫자나라 — 작업 기록

## 계획 (2026-06-10 ~ 06-11, 전체 완료)

- [x] Task 1: 프로젝트 뼈대 + Node 확인
- [x] Task 2: 게임 로직 js/game.js (TDD)
- [x] Task 3: 진행도 저장 js/storage.js (TDD)
- [x] Task 4: 공룡 데이터 data/dinos.js (TDD)
- [x] Task 5: 오디오 레이어 js/audio.js
- [x] Task 6: 화면 — index.html, style.css, render.js
- [x] Task 7: 전체 연결 js/main.js + 수동 플레이 테스트
- [x] Task 8: 리얼 공룡 이미지 수집 (Wikimedia, 출처 기록)
- [x] Task 9: PWA — 아이콘, manifest, sw.js, 오프라인
- [x] Task 10: 최종 검증 + GitHub Pages 배포

## 리뷰

- **배포 주소**: https://jihomoon888-lgtm.github.io/dino-number-game/
- **저장소**: https://github.com/jihomoon888-lgtm/dino-number-game
- 단위 테스트 18/18 통과. 브라우저에서 3개 레벨 전체 플레이 검증 (오답 도리도리, 2연속 오답 힌트, 부화 연출, 별 저장/복원, 콘솔 에러 0).
- 서비스 워커 활성 + 22개 에셋 캐시 → 오프라인 동작.
- 작업 방식: 서브에이전트 구현 + 작업마다 스펙/품질 2단계 리뷰. 리뷰에서 잡은 것: Node 24 `npm test` 스크립트 버그, 약한 테스트 단언 2건, storage 검증 강화, 카르노타우루스 이미지 화풍 교체, 흰 배경 블렌드 처리.
- 배포 이슈: GitHub Pages 첫 빌드가 `building`에 고착 → `.nojekyll` 추가 푸시로 해결.

## 남은 아이디어 (추후 버전)

- 아빠/엄마 목소리 녹음 교체 (`assets/voice/n01.mp3`~`n10.mp3`, `praise01.mp3`)
- 먹이주기 모드(수량 개념), 한자어 읽기, 한글/영어 모드, 공룡 도감
