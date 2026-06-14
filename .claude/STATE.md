# STATE.md

## 마지막 실행
2026-06-14 16:50 KST — 루프 에이전트 자동 사이클

## 완료된 작업 (최신순)
- rowsToNodes 단위 테스트 추가: dev 커밋 완료 (9c99af0)
  - lib/tree/rowsToNodes.test.ts — 12개 테스트 (빈 매핑, titleColumn/nameColumn, parentId 연결, 자기참조 방지, 멀티시트 등)
  - 전체 테스트: 142개 → 154개
  - docs/TODO.md — 이미지 OCR 항목 완료 처리 ([x])
- PDF 파싱 worker 오류 수정: dev 커밋 완료 (81a0cf6)
  - lib/parser/pdfParser.ts — GlobalWorkerOptions.workerSrc를 빈 문자열 → pathToFileURL(pdf.worker.mjs) 경로로 변경
- HRIS 연동 구현: dev 커밋 완료 (b59c82a)
  - lib/parser/hrisParser.ts — XML(<employee>) + JSON(employees/data/members) 파싱
  - lib/parser/hrisParser.test.ts — 9개 테스트 (전체 142개 통과)
- HWP/HWPX 파일 파싱 구현: dev 커밋 완료 (0b1f195)
- 변경 이력 추적 구현: dev 커밋 완료 (d291ed8)
- 이미지 OCR 구현: dev 커밋 완료 (0212362)
- PR #33 dev → main: 머지 완료 (PDF worker 오류 수정)
- PR #32 dev → main: 머지 완료 (HRIS 연동)
- PR #31 dev → main: 머지 완료 (HWP/HWPX 파싱)
- PR #30 dev → main: 머지 완료 (변경 이력 추적)
- PR #29 dev → main: 머지 완료 (이미지 OCR)
- PR #28 dev → main: 머지 완료 (팀 공유 편집 링크)
- PR #27 dev → main: 머지 완료 (자유 텍스트 파싱 + PDF 파싱 + 플랜/워터마크)

## 현재 열린 PR
- PR #34 dev → main — 테스트 커버리지 보강 (rowsToNodes 단위 테스트 12개)
  URL: https://github.com/ysparkr841/orgchart/pull/34

## 다음 우선순위
1. PR #34 머지 대기
2. 추가 테스트 커버리지 보강 후보:
   - lib/export/watermark.ts (브라우저 API 의존 — jsdom 환경 필요)
   - lib/store/editor-store.ts, mapping-store.ts, parse-store.ts (Zustand 스토어)
3. 신규 기능 백로그 항목 추가 검토 (TODO.md P0~P3 전체 완료)
