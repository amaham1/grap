import type { Metadata } from "next";
import "./globals.css";
import { inter } from './fonts';
import ResponsiveHeader from '../ResponsiveHeader';

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
        {/* Outermost container, max 1580px, centered on screen */}
        <div className="max-w-8xl mx-auto w-full">
          {/* Flex container for sidebars and main content with gap and vertical alignment on md screens and up */}
          <div className="flex w-full md:gap-x-4 md:items-center">
            {/* Left Sidebar: 150px wide, 500px tall, vertically centered, visible on md screens and up */}
            <aside className="w-[150px] h-[500px] flex-shrink-0 bg-gray-200 hidden md:block">
              {/* You can add content to the left sidebar here if needed */}
            </aside>

            {/* Main Content Area Wrapper (takes remaining space in flex, or full width below md) */}
            <div className="flex-grow min-w-0">
              {/* Inner wrapper for 1280px content (Header, Main, Footer) */}
              <div className="max-w-screen-xl mx-auto w-full min-h-screen flex flex-col">
                <ResponsiveHeader />
                <main className="flex-grow w-full">
                  {children}
                </main>
                <footer className="bg-white border-t border-gray-200 py-8 w-full">
                  <div className="px-4 sm:px-6 lg:px-8">
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
              </div>
            </div>

            {/* Right Sidebar: 150px wide, 500px tall, vertically centered, visible on md screens and up */}
            <aside className="w-[150px] h-[500px] flex-shrink-0 bg-gray-200 hidden md:block">
              {/* You can add content to the right sidebar here if needed */}
            </aside>
          </div>

          {/* Bottom Box: Visible on screens smaller than md (768px) */}
          <div className="block md:hidden max-w-screen-xl mx-auto w-full h-[100px] bg-gray-300 my-4">
            {/* Content for the bottom box */}
            <p className="text-center p-4">페이지 하단 박스 (768px 미만에서 표시)</p>
          </div>
        </div>
      </body>
    </html>
  );
}
