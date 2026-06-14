/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // pdfjs-dist 서버 사이드 텍스트 추출 시 canvas 불필요
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
