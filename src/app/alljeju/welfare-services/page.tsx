import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import PageSizeSelector from '@/components/PageSizeSelector';

const DEFAULT_PAGE_SIZE = 10;
const AVAILABLE_SIZES = [10, 30, 50];

interface WelfarePageProps {
  searchParams?: {
    page?: string;
    size?: string;
  };
}

export default async function WelfareServicesPage({ searchParams }: WelfarePageProps) {
  const currentPage = parseInt(searchParams?.page || '1', 10);
  const itemsPerPage = parseInt(searchParams?.size || DEFAULT_PAGE_SIZE.toString(), 10);
  const validatedItemsPerPage = AVAILABLE_SIZES.includes(itemsPerPage) ? itemsPerPage : DEFAULT_PAGE_SIZE;

  const totalServices = await prisma.welfareService.count({
    where: { approved: true },
  });

  const totalPages = Math.ceil(totalServices / validatedItemsPerPage);

  const services = await prisma.welfareService.findMany({
    where: { approved: true },
    orderBy: { seq: 'desc' },
    skip: (currentPage - 1) * validatedItemsPerPage,
    take: validatedItemsPerPage,
  });

  return (
    <div className="bg-white min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* 서울시청 스타일 헤더 */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <div className="flex items-center">
          <div className="bg-[#e64c66] w-1 h-7 mr-3"></div>
          <h1 className="text-3xl font-bold text-[#333]">복지 서비스</h1>
        </div>
        <p className="mt-2 text-gray-500">지역 주민들을 위한 다양한 복지 서비스 정보를 확인하세요. (총 {totalServices}개)</p>
      </div>

      <PageSizeSelector defaultSize={DEFAULT_PAGE_SIZE} availableSizes={AVAILABLE_SIZES} />

      {services.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 font-medium">해당 페이지에는 복지 서비스가 없습니다.</p>
          <Link href={`/alljeju/welfare-services?page=1&size=${validatedItemsPerPage}`} className="mt-4 inline-block px-4 py-2 bg-[#e64c66] text-white rounded hover:bg-[#d33a52] transition-colors">
            첫 페이지로 돌아가기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <Link href={`/alljeju/welfare-services/${s.id}`} key={s.id} className="block">
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="h-48 bg-gray-100 relative">
                  {/* 임시 이미지 플레이스홀더 */}
                  <div className="w-full h-full flex items-center justify-center bg-[#fef0f2]">
                    <div className="text-center p-4">
                      <div className="text-[#e64c66] mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-medium text-gray-700">복지 서비스</h3>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{s.name}</h2>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {s.allLoc && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        전체
                      </span>
                    )}
                    {s.jejuLoc && (
                      <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        제주시
                      </span>
                    )}
                    {s.seogwipoLoc && (
                      <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        서귀포시
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-2 line-clamp-3">
                    {s.contents ? s.contents.replace(/<[^>]*>/g, '') : '내용 없음'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="inline-flex items-center -space-x-px">
            <Link
              href={`/alljeju/welfare-services?page=${Math.max(1, currentPage - 1)}&size=${validatedItemsPerPage}`}
              className={`px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              이전
            </Link>

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
                      className="px-4 py-2 border border-gray-300 text-sm font-medium bg-white text-gray-500"
                    >
                      ...
                    </span>
                  );
                }

                // 페이지 번호 링크
                return (
                  <Link
                    key={pageNumber}
                    href={`/alljeju/welfare-services?page=${pageNumber}&size=${validatedItemsPerPage}`}
                    className={`px-4 py-2 border border-gray-300 text-sm font-medium ${
                      currentPage === pageNumber
                        ? 'bg-[#e64c66] text-white hover:bg-[#d33a52]'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </Link>
                );
              });
            })()}

            <Link
              href={`/alljeju/welfare-services?page=${Math.min(totalPages, currentPage + 1)}&size=${validatedItemsPerPage}`}
              className={`px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              다음
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
