# STATE.md

## 마지막 실행
2026-06-17 14:53 KST — 루프 에이전트 자동 사이클

## 완료된 작업 (최신순)
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
- PR #37 dev → main — API 라우트 단위 테스트 추가 + vitest @/ alias + 나머지 라우트 테스트
  URL: https://github.com/ysparkr841/orgchart/pull/37

## 다음 우선순위
1. PR #37 머지 대기
2. app/api 라우트 테스트 전체 완료 (6개 라우트 모두 커버됨)
3. lib/prisma.ts 테스트 보강 검토 (DB 클라이언트 싱글톤 — 모킹 난이도 있음)
4. 신규 기능 백로그 항목 추가 검토 (TODO.md P0~P3 전체 완료)
