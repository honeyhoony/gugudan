import type { Metadata, Viewport } from "next";
import { Black_Han_Sans, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const display = Black_Han_Sans({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Noto_Sans_KR({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "한판 — 부서행사 화면 게임",
  description:
    "큰 화면으로 진행하고 휴대폰으로 참여하는 O/X 퀴즈·랜덤뽑기·순발력 게임",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#041513",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <div className="atmosphere relative min-h-dvh">
          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  );
}
