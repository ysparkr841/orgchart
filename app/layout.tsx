import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "조직도 빌더",
  description: "지저분한 입력을 AI가 트리 구조로 정리하는 조직도 빌더",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
