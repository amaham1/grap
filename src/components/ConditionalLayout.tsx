'use client';

import { usePathname } from 'next/navigation';
import ResponsiveHeader from '@/ResponsiveHeader';
import { ReactNode } from 'react';

interface ConditionalLayoutProps {
  children: ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isRootPath = pathname === '/';

  if (isRootPath) {
    return <main className="w-full">{children}</main>;
  }

  return (
    <div className="max-w-8xl mx-auto w-full">
      <div className="flex w-full md:gap-x-4 md:items-center">
        <aside className="w-[150px] h-[500px] flex-shrink-0 bg-gray-200 hidden md:block">
          {/* 왼쪽 사이드바 */}
        </aside>

        <div className="flex-grow min-w-0">
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
                    <p>{new Date().getFullYear()} GRAP. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </div>

        <aside className="w-[150px] h-[500px] flex-shrink-0 bg-gray-200 hidden md:block">
          {/* 오른쪽 사이드바 */}
        </aside>
      </div>

      <div className="block md:hidden max-w-screen-xl mx-auto w-full h-[100px] bg-gray-300 my-4">
        <p className="text-center p-4">페이지 하단 박스 (768px 미만에서 표시)</p>
      </div>
    </div>
  );
}
