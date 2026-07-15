import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { QueryProvider } from "@/app/queryProvider";
import { LandingIntro } from "@/features/landing/landingIntro";
import { I18nProvider } from "@/i18n/provider";

import "./globals.css";

const APP_NAME = "성덕순례";
const APP_DESCRIPTION =
  "드라마, 영화, 애니메이션의 촬영지를 발견하고 AI로 성지순례 여행 일정을 만들어 보세요.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  icons: {
    icon: [{ url: "/landing-icon.svg", type: "image/svg+xml" }],
    shortcut: ["/landing-icon.svg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <I18nProvider>
          <QueryProvider>
            {children}
            <LandingIntro />
          </QueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
