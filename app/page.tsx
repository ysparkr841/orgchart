import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">조직도 빌더</h1>
      <p className="text-gray-600">
        지저분한 입력 → AI 정리 → 편집 → 다양한 출력
      </p>
      <div className="flex gap-3">
        <Link
          href="/builder/upload"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-medium"
        >
          새 조직도 만들기
        </Link>
        <Link
          href="/dashboard"
          className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-lg hover:bg-gray-200 font-medium"
        >
          내 조직도 보기
        </Link>
      </div>
    </main>
  );
}
