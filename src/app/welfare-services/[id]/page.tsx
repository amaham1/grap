import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps { params: { id: string } }

export default async function WelfareServiceDetail({ params: { id: idString } }: PageProps) {
  const idNum = parseInt(idString, 10);
  if (isNaN(idNum)) return notFound();

  const service = await prisma.welfareService.findUnique({ where: { id: idNum } });
  if (!service) return notFound();

  return (
    <div className="bg-white min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* 뒤로가기 */}
        <Link href="/welfare-services" className="group inline-flex items-center text-[#e64c66] hover:text-[#c43a52] mb-6 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">복지 서비스 목록으로</span>
        </Link>
        
        {/* 헤더 */}
        <div className="mb-8 border-b border-gray-200 pb-5">
          <div className="flex items-center mb-2">
            <div className="bg-[#e64c66] w-1 h-7 mr-3"></div>
            <h1 className="text-3xl font-bold text-[#333]">{service.name}</h1>
          </div>
          <div className="flex flex-wrap items-center text-gray-500 my-4">
            <div className="flex items-center mr-6 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>제공 지역: {service.allLoc ? '전체' : service.jejuLoc ? '제주' : '서귀포'}</span>
            </div>
          </div>
        </div>
        
        {/* 컨텐츠 영역 */}
        <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 mb-6">
          {/* 태그 정보 */}
          <div className="bg-[#fef0f2] p-4 border-b border-gray-100">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[#e64c66] text-white mr-2">
              복지서비스
            </span>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {service.allLoc ? '전체 지역' : service.jejuLoc ? '제주 지역' : '서귀포 지역'}
            </span>
          </div>
          
          {/* 상세 정보 */}
          <div className="p-6">
            {/* 지원 내용 */}
            {service.support && (
              <div className="mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">지원 내용</h3>
                <p className="text-gray-700 whitespace-pre-line">{service.support.replace(/<br\s*\/?>/gi, '\n').replace(/&nbsp;/g, ' ').replace(/<[^>]*>/g, '')}</p>
              </div>
            )}
            
            {/* 신청 방법 */}
            {service.application && (
              <div className="mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">신청 방법</h3>
                <p className="text-gray-700 whitespace-pre-line">{service.application.replace(/<br\s*\/?>/gi, '\n').replace(/&nbsp;/g, ' ').replace(/<[^>]*>/g, '')}</p>
              </div>
            )}
            
            {/* 상세 내용 */}
            {service.contents ? (
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">상세 내용</h3>
                {(() => {
                  const textWithLineBreaks = service.contents.replace(/<br\s*\/?>/gi, '\n');
                  const textWithSpaces = textWithLineBreaks.replace(/&nbsp;/g, ' ');
                  const plainText = textWithSpaces.replace(/<[^>]*>/g, '');
                  return <div className="whitespace-pre-line">{plainText}</div>;
                })()}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                상세 내용이 없습니다.
              </div>
            )}
          </div>
        </div>
        
        {/* 하단 네비게이션 */}
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200">
          <Link href="/welfare-services" className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            목록으로
          </Link>
        </div>
      </div>
    </div>
  );
}
