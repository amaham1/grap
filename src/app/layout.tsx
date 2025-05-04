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
    <html lang="ko" className={inter.variable}>
      <body className="antialiased min-h-screen flex flex-col font-sans">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="text-xl font-semibold text-gray-900 dark:text-white hover:text-primary transition-colors">
                  GRAP
                </Link>
                <nav className="ml-10 flex items-center space-x-6">
                  <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-hover px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    홈
                  </Link>
                  <Link href="/external-exhibitions" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-hover px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    외부 전시회
                  </Link>
                  <Link href="/welfare-services" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-hover px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    복지 서비스
                  </Link>
                  <Link href="/jeju-events" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-hover px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    제주 행사
                  </Link>
                  <Link href="/junolda-events" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-hover px-3 py-2 rounded-md text-sm font-medium transition-colors">
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
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p> {new Date().getFullYear()} GRAP. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
