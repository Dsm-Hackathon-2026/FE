import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "성덕순례",
    short_name: "성덕순례",
    description:
      "드라마, 영화, 애니메이션의 촬영지를 발견하고 AI로 성지순례 여행 일정을 만들어 보세요.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    lang: "ko",
    icons: [
      {
        src: "/landing-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
