# STATE.md

## 마지막 실행
2026-06-14 15:52 KST — 루프 에이전트 자동 사이클

## 완료된 작업 (최신순)
- HRIS 연동 구현: dev 커밋 완료 (b59c82a)
  - lib/parser/hrisParser.ts — XML(<employee>) + JSON(employees/data/members) 파싱
  - lib/parser/hrisParser.test.ts — 9개 테스트 (전체 142개 통과)
  - lib/parser/fileType.ts — xml/json 타입 + isHris() 헬퍼 + MIME 감지 + 확장자 지원
  - lib/parser/fileType.test.ts — xml/json + isHris() 테스트 추가
  - app/api/parse/route.ts — isHris() 분기 + parseHris 연동
  - components/upload/FileList.tsx — xml/json 인디고 뱃지 추가
- HWP/HWPX 파일 파싱 구현: dev 커밋 완료 (0b1f195)
  - lib/parser/hwpParser.ts — @ssabrojs/hwpxjs 기반 텍스트 추출 + textParser 연동
  - lib/parser/hwpParser.test.ts — 6개 테스트 (전체 127개 통과)
  - lib/parser/fileType.ts — hwp/hwpx 타입 추가, isHwp() 헬퍼
  - lib/parser/fileType.test.ts — hwp/hwpx 테스트 케이스 추가
  - app/api/parse/route.ts — isHwp() 분기 처리 연동
  - components/upload/FileList.tsx — HWP/HWPX 파란색 뱃지
- 변경 이력 추적 구현: dev 커밋 완료 (d291ed8)
  - prisma/schema.prisma — ProjectSnapshot 모델 추가 + 마이그레이션
  - app/api/history/[projectId]/route.ts — GET(목록) + POST(복원) API
  - app/api/tree/route.ts — 저장 시 스냅샷 자동 기록
  - components/editor/HistoryPanel.tsx — 이력 패널 UI
  - app/builder/editor/page.tsx — "이력" 버튼 토글 연동
  - lib/history/snapshotUtils.ts — 직렬화 유틸 + 테스트 10개
- 이미지 OCR 구현: dev 커밋 완료 (0212362)
- PR #30 dev → main: 머지 완료 (변경 이력 추적)
- PR #29 dev → main: 머지 완료 (이미지 OCR)
- PR #28 dev → main: 머지 완료 (팀 공유 편집 링크)
- PR #27 dev → main: 머지 완료 (자유 텍스트 파싱 + PDF 파싱 + 플랜/워터마크)
- PR #26 dev → main: 머지 완료 (확대/축소 + 미니맵)
- PR #25 dev → main: 머지 완료 (검색/필터 + 노드 색상 커스터마이징)
- PR #24 dev → main: 머지 완료 (분할 뷰 + React/Vue 코드 익스포트)

## 현재 열린 PR
- PR #32 dev → main — HRIS 연동 + 누적 작업
  URL: https://github.com/ysparkr841/orgchart/pull/32

## 다음 우선순위
1. 사용자가 PR #32 머지
2. TODO.md 백로그 소진 — P0~P3 전체 완료 상태
3. 추가 기능: 테스트 커버리지 보강 또는 신규 백로그 항목 추가 필요
