'use client';

import { usePathname } from 'next/navigation';
import ResponsiveHeader from '../ResponsiveHeader'; // 경로 수정 가능성 있음
import { ReactNode } from 'react';

interface LayoutRendererProps {
  children: ReactNode;
}

export function LayoutRenderer({ children }: LayoutRendererProps) {
  const pathname = usePathname();

  // 루트 경로('/')와 /alljeju 경로에는 레이아웃을 적용하지 않음
  if (pathname === '/' || pathname === '/alljeju') {
    return <>{children}</>;
  }

  // 기존 RootLayout의 컨텐츠를 여기에 배치합니다.
  return (
    <div className="max-w-8xl mx-auto w-full">
      <div className="flex w-full md:gap-x-4 md:items-center">
        <aside className="w-[150px] h-[500px] flex-shrink-0 bg-gray-200 hidden md:block">
          AD (왼쪽)
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
                  <div className="text-center text-sm text-gray-500">
                    <p> {new Date().getFullYear()} GRAP. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </div>

        <aside className="w-[150px] h-[500px] flex-shrink-0 bg-gray-200 hidden md:block">
          AD (오른쪽)
        </aside>
      </div>

      <div className="block md:hidden max-w-screen-xl mx-auto w-full h-[100px] bg-gray-300 my-4">
        <p className="text-center p-4">AD (하단)</p>
      </div>
    </div>
  );
}
