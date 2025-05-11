import type { Metadata } from "next";
import "./globals.css";
import { inter } from './fonts';
import { ConditionalLayout } from '@/components/ConditionalLayout';

export const metadata: Metadata = {
  title: "GRAP - 그랩",
  description: "그랩 - 행사 및 지원 프로그램 관리 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} scroll-smooth`}>
      <body className="antialiased font-sans">
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
      </body>
    </html>
  );
}
