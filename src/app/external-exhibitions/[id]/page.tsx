import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Props { params: { id: string } }

export default async function ExternalExhibitionDetailPage({ params: { id: idString } }: Props) {
  const idNum = parseInt(idString, 10);
  if (isNaN(idNum)) return notFound();

  const exhibition = await prisma.externalExhibition.findUnique({ where: { id: idNum } });
  if (!exhibition) return notFound();

  return (
    <div className="bg-white min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* 뒤로가기 */}
        <Link href="/external-exhibitions" className="group inline-flex items-center text-[#8046cc] hover:text-[#6838a8] mb-6 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">외부 전시회 목록으로</span>
        </Link>
        
        {/* 헤더 */}
        <div className="mb-8 border-b border-gray-200 pb-5">
          <div className="flex items-center mb-2">
            <div className="bg-[#8046cc] w-1 h-7 mr-3"></div>
            <h1 className="text-3xl font-bold text-[#333]">{exhibition.title}</h1>
          </div>
          
          <div className="flex flex-wrap items-center text-gray-500 my-4">
            {exhibition.startDate && (
              <div className="flex items-center mr-6 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  {new Date(exhibition.startDate).toLocaleDateString('ko-KR', {year: 'numeric', month: 'long', day: 'numeric'})}
                  {exhibition.endDate && ' ~ '}
                  {exhibition.endDate ? new Date(exhibition.endDate).toLocaleDateString('ko-KR', {year: 'numeric', month: 'long', day: 'numeric'}) : '상시'}
                </span>
              </div>
            )}
            
            {(exhibition.locNames || exhibition.locs) && (
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{exhibition.locNames || exhibition.locs}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 전시회 이미지 */}
        {exhibition.cover && (
          <div className="rounded-lg overflow-hidden shadow-md mb-8">
            <img
              src={exhibition.cover}
              alt={exhibition.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}
        
        {/* 컨텐츠 영역 */}
        <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 mb-6">
          {/* 태그 정보 */}
          <div className="bg-[#f6f3fb] p-4 border-b border-gray-100">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[#8046cc] text-white mr-2">
              전시회
            </span>
            {exhibition.categoryName && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {exhibition.categoryName}
              </span>
            )}
            {!exhibition.categoryName && exhibition.category && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {exhibition.category}
              </span>
            )}
          </div>
          
          {/* 상세 정보 */}
          <div className="p-6">
            {/* 기본 정보 테이블 */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
              <table className="w-full text-sm">
                <tbody>
                  {(exhibition.locNames || exhibition.locs) && (
                    <tr className="border-b border-gray-200">
                      <td className="py-2 font-medium text-gray-700 pr-4">장소</td>
                      <td className="py-2 text-gray-600">{exhibition.locNames || exhibition.locs}</td>
                    </tr>
                  )}
                  {exhibition.tel && (
                    <tr className="border-b border-gray-200">
                      <td className="py-2 font-medium text-gray-700 pr-4">연락처</td>
                      <td className="py-2 text-gray-600">{exhibition.tel}</td>
                    </tr>
                  )}
                  {(exhibition.startDate || exhibition.endDate) && (
                    <tr>
                      <td className="py-2 font-medium text-gray-700 pr-4">기간</td>
                      <td className="py-2 text-gray-600">
                        {exhibition.startDate ? new Date(exhibition.startDate).toLocaleDateString('ko-KR') : '-'} ~ {exhibition.endDate ? new Date(exhibition.endDate).toLocaleDateString('ko-KR') : '상시'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* 전시회 설명 */}
            {exhibition.intro ? (
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">전시회 소개</h3>
                <div className="whitespace-pre-wrap text-gray-700">{exhibition.intro}</div>
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
          <Link href="/external-exhibitions" className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors">
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
