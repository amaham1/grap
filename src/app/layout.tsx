import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';
import { inter } from './fonts';



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
      <body className="antialiased min-h-screen flex flex-col font-sans">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="text-xl font-bold text-primary hover:opacity-80 transition-colors">
                  GRAP
                </Link>
                <nav className="ml-10 flex items-center space-x-6">
                  <Link href="/" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    홈
                  </Link>
                  <Link href="/external-exhibitions" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    외부 전시회
                  </Link>
                  <Link href="/welfare-services" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    복지 서비스
                  </Link>
                  <Link href="/jeju-events" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    제주 행사
                  </Link>
                  <Link href="/junolda-events" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    전시문화 행사
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-grow">
          {children}
        </main>
        <footer className="bg-white border-t border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center">
              <div className="text-primary font-bold text-xl mb-4">GRAP</div>
              <div className="flex space-x-6 mb-4">
                <a href="#" className="text-gray-500 hover:text-primary transition-colors">이용약관</a>
                <a href="#" className="text-gray-500 hover:text-primary transition-colors">개인정보처리방침</a>
                <a href="#" className="text-gray-500 hover:text-primary transition-colors">고객센터</a>
              </div>
              <div className="text-center text-sm text-gray-500">
                <p> {new Date().getFullYear()} GRAP. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
