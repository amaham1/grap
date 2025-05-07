"use client";

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface PageSizeSelectorProps {
  availableSizes?: number[];
  defaultSize?: number;
}

const DEFAULT_SIZES = [10, 30, 50];
const DEFAULT_PAGE_SIZE = 10;

export default function PageSizeSelector({
  availableSizes = DEFAULT_SIZES,
  defaultSize = DEFAULT_PAGE_SIZE,
}: PageSizeSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSize = parseInt(searchParams.get('size') || defaultSize.toString(), 10);

  const handleSizeChange = (newSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1'); // 페이지 크기 변경 시 1페이지로 리셋
    params.set('size', newSize.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center space-x-2 my-4 justify-end mr-1">
      <span className="text-sm text-gray-700">항목 수:</span>
      {availableSizes.map((size) => (
        <button
          key={size}
          onClick={() => handleSizeChange(size)}
          disabled={currentSize === size}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1
            ${
              currentSize === size
                ? 'bg-slate-700 text-white cursor-default shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed border border-slate-300 hover:border-slate-400'
            }`}
        >
          {size}개
        </button>
      ))}
    </div>
  );
}
