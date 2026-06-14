# TODO.md — 전체 백로그

## P0 — Critical (MVP 필수)

### 셋업
- [x] Next.js 14 프로젝트 초기화 (TypeScript + Tailwind + ESLint) — PR #1
- [x] Prisma + SQLite 연결 및 기본 스키마 (PostgreSQL → SQLite 전환) — PR #2
- [x] Ollama 클라이언트 유틸 구현 (lib/ai/ollama.ts) — PR #2
- [x] Ollama 연동 테스트 (llama3.2:3b 텍스트, isOllamaAvailable/chat/OllamaError) — PR #17

### 테스트 픽스처
- [x] tests/sample_data/ 샘플 조직도 CSV/XLSX 파일 추가 — PR #18

### 파일 업로드
- [x] 멀티 파일 드래그앤드롭 업로드 UI — PR #5
- [x] 업로드된 파일 미리보기 (헤더 + 샘플 5행) — PR #13
- [x] 파일 타입 감지 (xlsx, csv, jpg, png, pdf) — PR #14

### AI 파싱
- [x] 엑셀 컬럼 구조 분석 (guessNameColumn / guessTitleColumn / guessParentColumn) — PR #3
- [x] 멀티 파일 관계 추론 (lib/parser/relation.ts) — PR #16
- [ ] 이미지 조직도 OCR + 트리 추출 (qwen2.5vl:7b) — qwen2.5vl:7b 미설치로 블로킹 중
- [x] 파싱 결과 확인/수정 UI (컬럼 매핑) — PR #6

### 트리 핵심
- [x] 파싱 결과 → 트리 자료구조 변환 (lib/tree/builder.ts) — PR #4
- [x] D3.js 기본 트리 렌더링 — PR #7
- [x] 노드 드래그앤드롭 이동 — PR #15
- [x] 노드 추가/삭제/수정 — PR #9, #10
- [x] JSON 익스포트 — PR #11

## P1 — High

### 트리 레이아웃 다양화
- [x] 세로/가로 트리 레이아웃 — PR #19
- [x] 사진 포함 트리 — PR #23
- [x] 리스트 뷰 — PR #22
- [x] 트리 + 리스트 동시 표출 — dev 브랜치(PR #24)

### 익스포트
- [x] PNG/JPG 익스포트 — PR #11
- [x] PDF 익스포트 — PR #20
- [x] React 컴포넌트 코드 익스포트
- [x] Vue 컴포넌트 코드 익스포트

### 사용자 기능
- [x] 조직도 저장/불러오기 — PR #8
- [x] 대시보드 — PR #12
- [x] 공유 링크 — PR #21

## P2 — Medium

### 파싱 확장
- [ ] HWP 파일 파싱
- [x] PDF 파싱
- [x] 자유 텍스트 입력 파싱

### UI 개선
- [x] 노드 색상/스타일 커스터마이징
- [x] 검색 및 필터
- [x] 확대/축소 및 미니맵

### 수익화 기반
- [x] 무료/유료 플랜 구분
- [x] 워터마크
- [x] 팀 공유

## P3 — Low
- [ ] HRIS 연동
- [ ] 변경 이력 추적
- [x] Vercel 배포 자동화
- [x] GitHub Actions CI/CD
