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

      {exhibitions.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
           <p className="text-gray-500 font-medium">해당 페이지에는 외부 전시회가 없습니다.</p>
           <Link href={`/alljeju/external-exhibitions?page=1&size=${validatedItemsPerPage}`} className="mt-4 inline-block px-4 py-2 bg-[#8046cc] text-white rounded hover:bg-[#7a3bc8] transition-colors">
             첫 페이지로 돌아가기
           </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exhibitions.map((exhibition) => (
            <Link href={`/alljeju/external-exhibitions/${exhibition.id}`} key={exhibition.id} className="block">
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="h-48 bg-gray-100 relative">
                  {exhibition.coverThumb ? (
                    <img src={exhibition.coverThumb} alt={exhibition.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="text-gray-400">이미지 없음</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{exhibition.title}</h2>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {exhibition.categoryName && (
                      <span className="inline-block bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {exhibition.categoryName}
                      </span>
                    )}
                    {exhibition.stat && (
                      <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        exhibition.stat.toUpperCase() === 'ING' 
                          ? 'bg-green-100 text-green-800' 
                          : exhibition.stat.toUpperCase() === 'PLAN'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {exhibition.stat.toUpperCase() === 'ING' 
                          ? '진행중' 
                          : exhibition.stat.toUpperCase() === 'PLAN'
                            ? '예정'
                            : '종료'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {exhibition.startDate && (
                      <div>
                        {new Date(exhibition.startDate).toLocaleDateString('ko-KR')}
                        {exhibition.endDate && exhibition.startDate !== exhibition.endDate && 
                          ` ~ ${new Date(exhibition.endDate).toLocaleDateString('ko-KR')}`}
                      </div>
                    )}
                    {exhibition.place && <div>장소: {exhibition.place}</div>}
                    {exhibition.owner && <div>주최: {exhibition.owner}</div>}
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
              href={`/alljeju/external-exhibitions?page=${Math.max(1, currentPage - 1)}&size=${validatedItemsPerPage}`}
              className={`px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              이전
            </Link>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Link
                key={page}
                href={`/alljeju/external-exhibitions?page=${page}&size=${validatedItemsPerPage}`}
                className={`px-4 py-2 border border-gray-300 text-sm font-medium ${
                  currentPage === page
                    ? 'bg-[#8046cc] text-white hover:bg-[#7a3bc8]'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </Link>
            ))}
            
            <Link
              href={`/alljeju/external-exhibitions?page=${Math.min(totalPages, currentPage + 1)}&size=${validatedItemsPerPage}`}
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
