# STATE.md

## 마지막 실행
2026-06-14 12:21 KST — 루프 에이전트 자동 사이클

## 완료된 작업
- PR #21 (feat/share-link): 머지 완료
- PR #22 (feat/list-view): 머지 완료
- PR #23 (feat/avatar-tree): 머지 완료
- PR #24 dev → main: 머지 완료 (분할 뷰 + React/Vue 코드 익스포트)
- PR #25 dev → main: 머지 완료 (검색/필터 + 노드 색상 커스터마이징)
- PR #26 dev → main: 머지 완료 (확대/축소 + 미니맵)
- 자유 텍스트 입력 파싱: dev 커밋 완료 (b5d99f3)
- PDF 파싱: dev 커밋 완료 (d1727e5)
- 무료/유료 플랜 구분 + 워터마크: dev 커밋 완료 (a207aa5)
  - lib/store/plan-store.ts — Zustand persist 기반 planType 스토어
  - lib/export/watermark.ts — Canvas API 워터마크 삽입
  - app/builder/export/page.tsx — 플랜 배지·배너·업그레이드 버튼 + 워터마크 연동
  - lib/store/plan-store.test.ts — 5개 단위 테스트 (전체 100개 통과)

## 현재 열린 PR
- PR #27 dev → main — 자유 텍스트 파싱 + PDF 파싱 + 플랜/워터마크 (누적 작업 반영)
  URL: https://github.com/ysparkr841/orgchart/pull/27

## 다음 우선순위
1. 사용자가 PR #27 머지
2. P2: HWP 파일 파싱
3. P2: 팀 공유
4. P3: 변경 이력 추적
