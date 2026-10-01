import type { NextConfig } from "next";

// 정적 내보내기: 서버 없이 out/ 폴더만 올리면 동작 (GitHub Pages 등)
// 하위 주소에 올릴 때: BASE_PATH=/brewing-note npm run build
const basePath = process.env.BASE_PATH || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
