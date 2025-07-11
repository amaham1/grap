import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import PageSizeSelector from '@/components/PageSizeSelector';

interface PageProps {
  searchParams?: {
    page?: string;
    size?: string;
  };
}

const DEFAULT_PAGE_SIZE = 10;
const AVAILABLE_SIZES = [10, 30, 50];

export default async function ExternalExhibitionsPage({ searchParams }: PageProps) {
  const currentPage = parseInt(searchParams?.page || '1', 10);
  const itemsPerPage = parseInt(searchParams?.size || DEFAULT_PAGE_SIZE.toString(), 10);
  const validatedItemsPerPage = AVAILABLE_SIZES.includes(itemsPerPage) ? itemsPerPage : DEFAULT_PAGE_SIZE;

  const totalExhibitions = await prisma.externalExhibition.count({
    where: { approved: true },
  });

  const exhibitions = await prisma.externalExhibition.findMany({
    where: { approved: true },
    orderBy: { seq: 'desc' },
    skip: (currentPage - 1) * validatedItemsPerPage,
    take: validatedItemsPerPage,
  });

  const totalPages = Math.ceil(totalExhibitions / validatedItemsPerPage);

  return (
    <div className="bg-white min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* 서울시청 스타일 헤더 */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <div className="flex items-center">
          <div className="bg-[#8046cc] w-1 h-7 mr-3"></div>
          <h1 className="text-3xl font-bold text-[#333]">외부 전시회</h1>
        </div>
        <p className="mt-2 text-gray-500">다양한 외부 전시회 정보를 확인하고 참여해보세요.</p>
      </div>

      <PageSizeSelector defaultSize={DEFAULT_PAGE_SIZE} availableSizes={AVAILABLE_SIZES} />

      {totalExhibitions === 0 ? (
        <div className="text-center py-12 border rounded-lg shadow-sm">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-500 font-medium">등록된 전시회가 없습니다.</p>
          <p className="text-gray-400 text-sm mt-1">나중에 다시 확인해 주세요.</p>
        </div>
      ) : exhibitions.length === 0 && currentPage > 1 ? (
        <div className="text-center py-12 border rounded-lg shadow-sm">
           <p className="text-gray-500 font-medium">해당 페이지에는 외부 전시회가 없습니다.</p>
           <Link href={`/external-exhibitions?page=1&size=${validatedItemsPerPage}`} className="mt-4 inline-block px-4 py-2 bg-[#8046cc] text-white rounded hover:bg-[#7a3bc8] transition-colors">
             첫 페이지로 돌아가기
           </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exhibitions.map((exhibition) => (
            <Link href={`/external-exhibitions/${exhibition.id}`} key={exhibition.id} className="block">
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="h-48 bg-gray-100 relative">
                  {exhibition.coverThumb ? (
                    <img src={exhibition.coverThumb} alt={exhibition.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#f6f3fb]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[#8046cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs inline-block px-2 py-1 rounded-full bg-[#f1ebf9] text-[#8046cc]">
                      전시회
                    </div>
                    {exhibition.categoryName && (
                      <div className="text-xs inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {exhibition.categoryName}
                      </div>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-[#333] mb-3 line-clamp-2 h-14">{exhibition.title}</h2>

                  {(exhibition.startDate || exhibition.endDate) && (
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {exhibition.startDate && new Date(exhibition.startDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                        {exhibition.startDate && exhibition.endDate && ' ~ '}
                        {exhibition.endDate && new Date(exhibition.endDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  )}

                  {(exhibition.locNames || exhibition.locs) && (
                    <div className="flex items-center text-gray-500 text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{exhibition.locNames || exhibition.locs}</span>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 py-3 px-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">자세히 보기</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#8046cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalExhibitions > 0 && (
        <div className="mt-10 flex justify-center">
          <nav className="flex items-center">
            {currentPage > 1 ? (
              <Link href={`/external-exhibitions?page=${currentPage - 1}&size=${validatedItemsPerPage}`} className="mr-2 p-2 rounded border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            ) : (
              <span className="mr-2 p-2 rounded border border-gray-200 text-gray-300 cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </span>
            )}
            <div className="flex space-x-1">
              {(() => {
                // 페이지 번호 계산 로직
                const visiblePageNumbers = [];
                const maxVisiblePages = 5; // 최대 표시할 페이지 수

                // 첫 페이지는 항상 표시
                if (1 < currentPage - Math.floor(maxVisiblePages / 2)) {
                  visiblePageNumbers.push(1);
                  // 첫 페이지와 현재 페이지 사이에 간격이 있으면 생략 표시
                  if (currentPage - Math.floor(maxVisiblePages / 2) > 2) {
                    visiblePageNumbers.push('ellipsis1');
                  }
                }

                // 현재 페이지 주변의 페이지 계산
                const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                // 실제 표시할 페이지 범위 조정
                const adjustedStartPage = Math.max(1, endPage - maxVisiblePages + 1);

                // 현재 페이지 주변의 페이지 추가
                for (let i = adjustedStartPage; i <= endPage; i++) {
                  visiblePageNumbers.push(i);
                }

                // 마지막 페이지는 항상 표시
                if (endPage < totalPages) {
                  // 현재 페이지와 마지막 페이지 사이에 간격이 있으면 생략 표시
                  if (endPage < totalPages - 1) {
                    visiblePageNumbers.push('ellipsis2');
                  }
                  visiblePageNumbers.push(totalPages);
                }

                return visiblePageNumbers.map((pageNumber, index) => {
                  // 생략 표시(...)
                  if (pageNumber === 'ellipsis1' || pageNumber === 'ellipsis2') {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="w-10 h-10 flex items-center justify-center text-gray-500"
                      >
                        ...
                      </span>
                    );
                  }

                  // 페이지 번호 링크
                  return (
                    <Link
                      key={pageNumber}
                      href={`/external-exhibitions?page=${pageNumber}&size=${validatedItemsPerPage}`}
                      className={`w-10 h-10 flex items-center justify-center rounded transition-colors
                        ${pageNumber === currentPage
                          ? 'bg-[#8046cc] text-white cursor-default'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
                      aria-current={pageNumber === currentPage ? 'page' : undefined}
                    >
                      {pageNumber}
                    </Link>
                  );
                });
              })()}
            </div>
            {currentPage < totalPages ? (
              <Link href={`/external-exhibitions?page=${currentPage + 1}&size=${validatedItemsPerPage}`} className="ml-2 p-2 rounded border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <span className="ml-2 p-2 rounded border border-gray-200 text-gray-300 cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
