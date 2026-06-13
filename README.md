# 조직도 빌더 (OrgChart Builder)

지저분한 조직 데이터(엑셀·이미지·멀티 파일)를 AI가 트리 구조로 정리하고,
웹에서 편집한 뒤 다양한 포맷으로 내보내는 웹 서비스.

## 기술 스택
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS / Zustand / React Query
- D3.js (트리 렌더링)
- SheetJS · PDF.js (파일 파싱)
- Ollama 로컬 (llama3.2:3b 텍스트, qwen2.5vl:7b 비전)
- PostgreSQL + Prisma ORM

## 시작하기
```bash
npm install
cp .env.example .env   # DATABASE_URL 등 채우기
npm run db:generate
npm run dev            # http://localhost:3000
```

## 스크립트
- `npm run dev` — 개발 서버
- `npm run build` — 프로덕션 빌드
- `npm run lint` — ESLint
- `npm run test` — Vitest
- `npm run typecheck` — TypeScript 타입 검사
- `npm run db:migrate` — Prisma 마이그레이션
