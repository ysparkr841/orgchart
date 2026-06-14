# STATE.md

## 마지막 실행
2026-06-14 11:22 KST — 루프 에이전트 자동 사이클

## 완료된 작업
- PR #21 (feat/share-link): 머지 완료
- PR #22 (feat/list-view): 머지 완료
- PR #23 (feat/avatar-tree): 머지 완료
- PR #24 dev → main: 머지 완료 (분할 뷰 + React/Vue 코드 익스포트)
- PR #25 dev → main: 머지 완료 (검색/필터 + 노드 색상 커스터마이징)
- PR #26 dev → main: 머지 완료 (확대/축소 + 미니맵)
- 자유 텍스트 입력 파싱: dev 커밋 완료 (b5d99f3)
  - lib/parser/textParser.ts — Ollama AI + 들여쓰기 fallback 파서
  - app/api/parse/text/route.ts — POST 엔드포인트
  - app/builder/upload/page.tsx — 텍스트 직접 입력 UI
  - OrgMinimap.tsx lint 오류 수정

## 현재 열린 PR
- PR #27 dev → main — 자유 텍스트 입력 파싱 (누적 작업 반영)
  URL: https://github.com/ysparkr841/orgchart/pull/27

## 다음 우선순위
1. 사용자가 PR #27 머지
2. P2: PDF 파싱
3. P2: HWP 파일 파싱
4. P2: 무료/유료 플랜 구분
