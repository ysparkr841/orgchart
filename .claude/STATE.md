# STATE.md

## 마지막 실행
2026-06-17 17:14 KST — 루프 에이전트 자동 사이클

## 완료된 작업 (최신순)
- OrgTreeChart 컴포넌트 분리: dev 커밋 완료 (e4c9ded)
  - hooks/useOrgTreeD3.ts 신규 — D3 렌더링·드래그·줌 로직 전체 추출
  - components/tree/ZoomControls.tsx 신규 — 줌 버튼 UI 컴포넌트
  - OrgTreeChart.tsx: 363줄 → 36줄 (200줄 초과 해소)
  - lib/tree/builder.ts: TreeLayout 타입 export 추가
  - 전체 테스트 343개 유지
- API 라우트 에러 처리 헬퍼화: dev 커밋 완료 (9171af0)
  - lib/api/routeHelpers.ts 신규 생성 (apiError · serverError · parseJsonBody)
  - 6개 API 라우트 적용 — NextResponse.json 중복 및 console.error+500 패턴 제거
  - routeHelpers.test.ts 5개 테스트 추가 (338 → 343개)
- exporter 공통 헬퍼 추출: dev 커밋 완료 (1f0c655)
  - lib/export/exportHelpers.ts 신규 생성 (EXPORT_HEADERS + nodeToRow)
  - csvExporter.ts, excelExporter.ts — 중복 HEADERS 상수 및 rows 매핑 로직 제거
  - 전체 테스트 338개 유지
- 접근성(a11y) 개선: dev 커밋 완료 (c7daab7)
  - FileDropZone: aria-disabled, Space 키 지원
  - OrgListView: table aria-label, th scope, tr aria-selected + Enter/Space 키보드 내비게이션
  - NodeEditPanel: label-input htmlFor/id 연결, 버튼 type="button", aria-label, aria-pressed
  - HistoryPanel: 에러 role="alert", 목록 aria-label, 새로고침 버튼 aria-label
  - 테스트 12개 추가: 326개 → 338개
- 검색 결과 자동 pan 기능 추가: dev 커밋 완료 (c8403db)
  - OrgTreeChart에 focusId prop 추가 — 검색 시 첫 번째 매칭 노드로 D3 zoom 자동 이동
  - 에디터 페이지: highlightIds 첫 번째 결과를 focusId로 계산해 OrgTreeChart에 전달
  - OrgTreeChart.test.tsx: focusId 렌더링 테스트 추가
  - 전체 테스트: 325개 → 326개
- CSV 내보내기 기능 추가: dev 커밋 완료 (ffd1281)
  - lib/export/csvExporter.ts — 순수 문자열 처리 기반 RawNode[] → CSV 변환
  - GET /api/export?format=csv 지원 (기존 json/xlsx 유지)
  - 쉼표·큰따옴표·개행 포함 셀 자동 이스케이프
  - csvExporter.test.ts 9개 + route.test.ts CSV 케이스 1개 추가
  - 전체 테스트: 315개 → 325개 (38 → 39 파일)
- XLSX 내보내기 기능 추가: dev 커밋 완료 (0cd6b20)
  - lib/export/excelExporter.ts — SheetJS 기반 RawNode[] → XLSX 변환
  - GET /api/export?format=xlsx 지원 (기존 json 포맷 유지, 잘못된 포맷 400)
  - excelExporter.test.ts 8개 + route.test.ts 2개 추가
  - 전체 테스트: 305개 → 315개 (37 → 38 파일)
- React 컴포넌트 단위 테스트 추가 3차: dev 커밋 완료 (52decb8)
  - components/editor/HistoryPanel.test.tsx — 6개 테스트 (stubFetch call desync 버그 수정)
  - components/tree/OrgListView.test.tsx — 8개 테스트 (검색 필터링 + 선택 상태)
  - components/tree/OrgMinimap.test.tsx — 4개 테스트 (SVG 미니맵)
  - components/tree/OrgTreeChart.test.tsx — 5개 테스트 (jsdom viewBox 스텁 + zoom try-catch)
  - OrgTreeChart.tsx: zoom.transform try-catch로 jsdom 환경 호환성 확보
  - 전체 테스트: 281개 → 305개 (33 → 37 파일)
- React 컴포넌트 단위 테스트 추가 2차: dev 커밋 완료 (3273856)
  - components/upload/FileDropZone.test.tsx — 9개 테스트 (drag/drop, input, disabled)
  - components/mapping/ColumnMappingForm.test.tsx — 7개 테스트 (렌더링, 셀렉트, 스토어)
  - components/editor/NodeEditPanel.test.tsx — 7개 테스트 (편집/삭제/자식추가/이동)
  - 전체 테스트: 258개 → 281개 (30 → 33 파일)
- React 컴포넌트 단위 테스트 추가 1차: dev 커밋 완료 (9cb7387)
  - @testing-library/react + @vitejs/plugin-react 설치
  - vitest.setup.ts — jest-dom 매처 + cleanup 설정
  - components/upload/FilePreview.test.tsx — 10개 테스트
  - components/upload/FileList.test.tsx — 13개 테스트
  - 전체 테스트: 235개 → 258개 (28 → 30 파일)
- lib/prisma.ts 싱글톤 패턴 단위 테스트 추가: dev 커밋 완료 (1770657)
  - lib/prisma.test.ts — 4개 테스트 (vi.stubEnv + vi.resetModules 패턴)
  - 전체 테스트: 231개 → 235개 (27 → 28 파일)
- POST /api/parse 라우트 단위 테스트 추가: dev 커밋 완료 (f830263)
  - app/api/parse/route.test.ts — 9개 테스트 (formData 실패, files 없음, xlsx/pdf/이미지/hwp/hris/미지원/복수파일)
  - 전체 테스트: 222개 → 231개 (26 → 27 파일)
- 나머지 API 라우트 단위 테스트 추가: dev 커밋 완료 (24b7968)
  - app/api/tree/[id]/route.test.ts — 3개 테스트 (단일 프로젝트 조회, 404, meta 파싱)
  - app/api/history/[projectId]/route.test.ts — 7개 테스트 (GET 스냅샷 목록, POST 복원 흐름)
  - app/api/export/route.test.ts — 3개 테스트 (JSON attachment 다운로드)
  - 전체 테스트: 209개 → 222개 (23 → 26 파일)
- API 라우트 단위 테스트 추가: dev 커밋 완료 (3664537)
  - vitest.config.ts — resolve.alias `@` → 프로젝트 루트 추가
  - app/api/parse/text/route.test.ts — 5개 테스트 (vi.hoisted + vi.mock 패턴)
  - app/api/tree/route.test.ts — 6개 테스트 (Prisma 모킹)
  - 전체 테스트: 198개 → 209개 (21 → 23 파일)
- watermark.ts 단위 테스트 추가: dev 커밋 완료 (5abf318)
  - lib/export/watermark.test.ts — 8개 테스트 (jsdom 환경, Canvas/Image mock)
  - jsdom devDependency 추가
  - 전체 테스트: 190개 → 198개 (20 → 21 파일)
- Zustand 스토어 단위 테스트 추가: dev 커밋 완료 (676095a)
  - lib/store/editor-store.test.ts — 20개 테스트
  - lib/store/mapping-store.test.ts — 8개 테스트
  - lib/store/parse-store.test.ts — 8개 테스트
  - 전체 테스트: 154개 → 190개 (17 → 20 파일)
- rowsToNodes 단위 테스트 추가: dev 커밋 완료 (9c99af0)
- PDF 파싱 worker 오류 수정: dev 커밋 완료 (81a0cf6)
- HRIS 연동 구현: dev 커밋 완료 (b59c82a)
- HWP/HWPX 파일 파싱 구현: dev 커밋 완료 (0b1f195)
- 변경 이력 추적 구현: dev 커밋 완료 (d291ed8)
- 이미지 OCR 구현: dev 커밋 완료 (0212362)
- PR #36 dev → main: 머지 완료 (watermark 테스트)
- PR #35 dev → main: 머지 완료 (Zustand 스토어 테스트)
- PR #34 dev → main: 머지 완료 (rowsToNodes 테스트)
- PR #33 dev → main: 머지 완료 (PDF worker 오류 수정)
- PR #32 dev → main: 머지 완료 (HRIS 연동)
- PR #31 dev → main: 머지 완료 (HWP/HWPX 파싱)
- PR #30 dev → main: 머지 완료 (변경 이력 추적)
- PR #29 dev → main: 머지 완료 (이미지 OCR)
- PR #28 dev → main: 머지 완료 (팀 공유 편집 링크)
- PR #27 dev → main: 머지 완료 (자유 텍스트 파싱 + PDF 파싱 + 플랜/워터마크)

## 현재 열린 PR
- PR #40 dev → main — CSV 내보내기 기능 추가
  URL: https://github.com/ysparkr841/orgchart/pull/40

## 다음 우선순위
1. PR #40 머지 대기 (CSV 내보내기 + 접근성 개선 + exporter 리팩토링 + API 헬퍼 + OrgTreeChart 분리 포함)
2. 추가 개선 후보: ZoomControls 테스트 추가, useOrgTreeD3 테스트 보강
