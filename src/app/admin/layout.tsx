'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuItems = [
    { label: '대시보드', href: '/admin/dashboard' },
    { label: '외부전시', href: '/admin/external-exhibitions' },
  ];

  return (
    <div className="flex h-screen bg-white text-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded shadow-md"
        aria-label="Toggle sidebar"
      >
        ☰
      </button>
      <aside
        className={`bg-gray-100 text-gray-800 fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform w-64 flex-shrink-0 shadow-lg border-r border-gray-200`}
      >
        <div className="p-4 text-lg font-bold border-b border-gray-200 bg-blue-600 text-white">관리자</div>
        <nav className="mt-5 flex flex-col" aria-label="사이드바 메뉴">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 hover:bg-blue-100 ${isActive ? 'bg-blue-100 font-bold text-blue-600' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 ml-0 md:ml-64 overflow-auto p-6 bg-white">
        {children}
      </main>
    </div>
  );
}
