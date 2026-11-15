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
  title: "한판 | 대구본부 에너지효율부 온라인 체육대회",
  description:
    "대구본부 에너지효율부 온라인 체육대회 — O/X, 오봉산 보물찾기, 태양광 사다리",
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
