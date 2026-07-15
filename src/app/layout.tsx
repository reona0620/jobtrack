import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobTrack | 就活管理アプリ",
  description: "応募企業、締切、選考状況をまとめて管理できる就活支援アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
