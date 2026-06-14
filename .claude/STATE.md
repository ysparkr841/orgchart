# STATE.md

## 마지막 실행
2026-06-14 14:20 KST — 루프 에이전트 자동 사이클

## 완료된 작업 (최신순)
- 이미지 OCR 구현: dev 커밋 완료 (0212362)
  - lib/parser/imageParser.ts — qwen2.5vl:7b 비전 모델로 이미지 조직도 추출
  - lib/parser/fileType.ts — isImage() 헬퍼 추가
  - app/api/parse/route.ts — 이미지 파일 처리 연동
  - 테스트 6개 추가, 전체 106개 통과
- PR #21 (feat/share-link): 머지 완료
- PR #22 (feat/list-view): 머지 완료
- PR #23 (feat/avatar-tree): 머지 완료
- PR #24 dev → main: 머지 완료 (분할 뷰 + React/Vue 코드 익스포트)
- PR #25 dev → main: 머지 완료 (검색/필터 + 노드 색상 커스터마이징)
- PR #26 dev → main: 머지 완료 (확대/축소 + 미니맵)
- PR #27 dev → main: 머지 완료 (자유 텍스트 파싱 + PDF 파싱 + 플랜/워터마크)
- 팀 공유(편집 링크): dev 커밋 완료 (df8edb8)
  - app/share/[id]/page.tsx — ?edit=1 편집 모드, NodeEditPanel + 저장 버튼
  - app/builder/editor/page.tsx — 편집 링크 복사 버튼 추가
- GitHub Actions CI/CD: dev 커밋 완료 (eba1eaf)
  - .github/workflows/ci.yml — push(dev)/PR(main) 시 lint/typecheck/test 자동 실행
- Vercel 배포 자동화: dev 커밋 완료 (fdf5aa7)
  - .github/workflows/deploy.yml — main 브랜치 push 시 Vercel 자동 배포
  - ⚠️ 사용자 설정 필요: GitHub Secrets에 VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID 추가

## 현재 열린 PR
- PR #29 dev → main — 이미지 OCR 구현 (P0 완료)
  URL: https://github.com/ysparkr841/orgchart/pull/29

## 다음 우선순위
1. 사용자가 PR #29 머지
2. P3: 변경 이력 추적 (노드 수정/삭제 내역 기록 및 복원)
3. P2: HWP 파일 파싱
4. Vercel GitHub Secrets 설정 (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)
