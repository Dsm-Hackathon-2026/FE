import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sdsr-bucket.s3.ap-northeast-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "blog.kakaocdn.net",
      },
      {
        protocol: "https",
        hostname: "i1.daumcdn.net",
        pathname: "/thumb/**",
      },
    ],
  },
  async rewrites() {
    const apiBaseUrl = process.env.API_BASE_URL;

    if (!apiBaseUrl) {
      throw new Error("API_BASE_URL 환경 변수가 필요합니다.");
    }

    return [
      {
        source: "/backend-api/:path*",
        destination: `${apiBaseUrl.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
