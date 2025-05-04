import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps { params: { seq: string } }

export default async function JunoldaEventDetail({ params }: PageProps) {
  const seq = Number(params.seq);
  const event = await prisma.junoldaEvent.findUnique({ where: { seq } });
  if (!event) return notFound();

  return (
    <div className="bg-white min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* 뒤로가기 */}
        <Link href="/junolda-events" className="group inline-flex items-center text-[#0075c1] hover:text-[#005c98] mb-6 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">전시문화 행사 목록으로</span>
        </Link>
        
        {/* 헤더 */}
        <div className="mb-8 border-b border-gray-200 pb-5">
          <div className="flex items-center mb-2">
            <div className="bg-[#0075c1] w-1 h-7 mr-3"></div>
            <h1 className="text-3xl font-bold text-[#333]">{event.title}</h1>
          </div>
          <div className="flex flex-wrap items-center text-gray-500 my-4">
            <div className="flex items-center mr-6 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{event.writeDate ? new Date(event.writeDate).toLocaleDateString('ko-KR', {year: 'numeric', month: 'long', day: 'numeric'}) : '-'}</span>
            </div>
            {event.writer && (
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{event.writer}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 컨텐츠 영역 */}
        <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 mb-6">
          {/* 태그 정보 */}
          <div className="bg-[#f0f6fc] p-4 border-b border-gray-100">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[#0075c1] text-white mr-2">
              문화행사
            </span>
            {/* 추가 태그가 있다면 여기에 표시 */}
          </div>
          
          {/* 상세 정보 */}
          <div className="p-6">
            {event.contents ? (
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: event.contents }} />
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
          <Link href="/junolda-events" className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors">
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
