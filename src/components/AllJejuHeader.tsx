'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function AllJejuHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary hover:opacity-80 transition-colors">
              GRAP
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link
              href="/alljeju"
              className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              홈
            </Link>
            <Link
              href="/alljeju/external-exhibitions"
              className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              외부 전시회
            </Link>
            <Link
              href="/alljeju/welfare-services"
              className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              복지 서비스
            </Link>
            <Link
              href="/alljeju/jeju-events"
              className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              제주 행사
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-primary focus:outline-none p-2 rounded-md"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
            <Link
              href="/alljeju"
              className="text-gray-600 hover:text-primary hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              홈
            </Link>
            <Link
              href="/alljeju/external-exhibitions"
              className="text-gray-600 hover:text-primary hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              외부 전시회
            </Link>
            <Link
              href="/alljeju/welfare-services"
              className="text-gray-600 hover:text-primary hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              복지 서비스
            </Link>
            <Link
              href="/alljeju/jeju-events"
              className="text-gray-600 hover:text-primary hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              제주 행사
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
