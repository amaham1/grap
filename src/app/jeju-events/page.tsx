import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';

export default async function JejuEventsPage() {
  const events = await prisma.jejuEvent.findMany({ where: { approved: true }, orderBy: { seq: 'desc' } });

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
      
      {events.length === 0 ? (
        <div className="text-center py-12 border rounded-lg shadow-sm">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-500 font-medium">등록된 제주 행사가 없습니다.</p>
          <p className="text-gray-400 text-sm mt-1">나중에 다시 확인해 주세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((e) => (
            <Link href={`/jeju-events/${e.id}`} key={e.id} className="block">
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="h-48 bg-gray-100 relative">
                  {/* 임시 이미지 플레이스홀더 */}
                  <div className="w-full h-full flex items-center justify-center bg-[#f0faf6]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[#007c51]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs inline-block px-2 py-1 rounded-full bg-[#e7f7f1] text-[#007c51] mb-2">제주행사</div>
                  <h2 className="text-lg font-semibold text-[#333] mb-2 line-clamp-2 h-14">{e.title}</h2>
                  <div className="flex items-center text-gray-500 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {new Date(e.writeDate).toLocaleDateString('ko-KR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 py-3 px-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">자세히 보기</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#007c51]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {/* 서울시청 스타일 페이지네이션 */}
      {events.length > 0 && (
        <div className="mt-10 flex justify-center">
          <nav className="flex items-center">
            <button className="mr-2 p-2 rounded border border-gray-300 text-gray-500 hover:bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex space-x-1">
              <button className="w-10 h-10 flex items-center justify-center rounded bg-[#007c51] text-white">1</button>
              {/* 추가 페이지 버튼들은 실제 페이지네이션 구현 시 동적으로 생성하세요 */}
            </div>
            <button className="ml-2 p-2 rounded border border-gray-300 text-gray-500 hover:bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}