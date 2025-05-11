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

export default async function JejuEventsPage({ searchParams }: PageProps) {
  const currentPage = parseInt(searchParams?.page || '1', 10);
  const itemsPerPage = parseInt(searchParams?.size || DEFAULT_PAGE_SIZE.toString(), 10);
  const validatedItemsPerPage = AVAILABLE_SIZES.includes(itemsPerPage) ? itemsPerPage : DEFAULT_PAGE_SIZE;

  const totalEvents = await prisma.jejuEvent.count({
    where: { approved: true },
  });

  const events = await prisma.jejuEvent.findMany({
    where: { approved: true },
    orderBy: { seq: 'desc' },
    skip: (currentPage - 1) * validatedItemsPerPage,
    take: validatedItemsPerPage,
  });

  const totalPages = Math.ceil(totalEvents / validatedItemsPerPage);

  return (
    <div className="bg-white min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* 서울시청 스타일 헤더 */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <div className="flex items-center">
          <div className="bg-[#007c51] w-1 h-7 mr-3"></div>
          <h1 className="text-3xl font-bold text-[#333]">제주 행사</h1>
        </div>
        <p className="mt-2 text-gray-500">제주도에서 열리는 다양한 행사 및 축제 정보를 확인하세요.</p>
      </div>
      
      <PageSizeSelector defaultSize={DEFAULT_PAGE_SIZE} availableSizes={AVAILABLE_SIZES} />

      {events.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
           <p className="text-gray-500 font-medium">해당 페이지에는 제주 행사가 없습니다.</p>
           <Link href={`/alljeju/jeju-events?page=1&size=${validatedItemsPerPage}`} className="mt-4 inline-block px-4 py-2 bg-[#007c51] text-white rounded hover:bg-[#005c3c] transition-colors">
             첫 페이지로 돌아가기
           </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link href={`/alljeju/jeju-events/${event.id}`} key={event.id} className="block">
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="h-48 bg-gray-100 relative">
                  {/* 임시 이미지 플레이스홀더 */}
                  <div className="w-full h-full flex items-center justify-center bg-[#f0faf6]">
                    <div className="text-center p-4">
                      <div className="text-[#007c51] mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-medium text-gray-700">제주 행사</h3>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{event.title}</h2>
                  <div className="text-sm text-gray-600 mb-2">
                    {event.writeDate && (
                      <div className="text-xs text-gray-500">
                        작성일: {new Date(event.writeDate).toLocaleDateString('ko-KR')}
                      </div>
                    )}
                    {event.writer && (
                      <div className="text-xs text-gray-500">
                        작성자: {event.writer}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-2 line-clamp-3">
                    {event.contents ? event.contents.replace(/<[^>]*>/g, '') : '내용 없음'}
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
              href={`/alljeju/jeju-events?page=${Math.max(1, currentPage - 1)}&size=${validatedItemsPerPage}`}
              className={`px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              이전
            </Link>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Link
                key={page}
                href={`/alljeju/jeju-events?page=${page}&size=${validatedItemsPerPage}`}
                className={`px-4 py-2 border border-gray-300 text-sm font-medium ${
                  currentPage === page
                    ? 'bg-[#007c51] text-white hover:bg-[#005c3c]'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </Link>
            ))}
            
            <Link
              href={`/alljeju/jeju-events?page=${Math.min(totalPages, currentPage + 1)}&size=${validatedItemsPerPage}`}
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
