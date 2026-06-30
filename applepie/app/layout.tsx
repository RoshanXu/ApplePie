import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApplePie — 成长可以快乐",
  description: "AI 驱动的学习成长应用，帮每个孩子找到自己的学习节奏和兴趣方向",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ApplePie",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <div className="page-container">{children}</div>
      </body>
    </html>
  );
}
