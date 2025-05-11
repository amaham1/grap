import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface PageProps {
  params: { id: string };
}

export default async function ExhibitionDetail({ params: { id: idString } }: PageProps) {
  const idNum = parseInt(idString, 10);
  if (isNaN(idNum)) return notFound();

  const exhibition = await prisma.externalExhibition.findUnique({ where: { id: idNum } });
  if (!exhibition || !exhibition.approved) return notFound();

  // 상태 텍스트 및 색상 클래스 결정
  let statusText = '정보 없음';
  let statusColorClass = 'bg-gray-100 text-gray-800';

  if (exhibition.stat) {
    if (exhibition.stat.toUpperCase() === 'ING') {
      statusText = '진행중';
      statusColorClass = 'bg-green-100 text-green-800';
    } else if (exhibition.stat.toUpperCase() === 'PLAN') {
      statusText = '예정';
      statusColorClass = 'bg-blue-100 text-blue-800';
    } else if (exhibition.stat.toUpperCase() === 'END') {
      statusText = '종료';
      statusColorClass = 'bg-red-100 text-red-800';
    }
  }

  return (
    <div className="bg-white min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* 뒤로가기 */}
        <Link href="/alljeju/external-exhibitions" className="group inline-flex items-center text-[#8046cc] hover:text-[#6a3aad] mb-6 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">전시회 목록으로</span>
        </Link>

        {/* 제목 및 상태 */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            {exhibition.categoryName && (
              <span className="inline-block bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {exhibition.categoryName}
              </span>
            )}
            <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColorClass}`}>
              {statusText}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{exhibition.title}</h1>
        </div>

        {/* 이미지 */}
        {exhibition.coverImage && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-md">
            <img src={exhibition.coverImage} alt={exhibition.title} className="w-full h-auto" />
          </div>
        )}

        {/* 정보 테이블 */}
        <div className="mb-8 border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white divide-y divide-gray-200">
              {exhibition.startDate && (
                <tr>
                  <th className="px-6 py-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">기간</th>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(exhibition.startDate).toLocaleDateString('ko-KR')}
                    {exhibition.endDate && exhibition.startDate !== exhibition.endDate && 
                      ` ~ ${new Date(exhibition.endDate).toLocaleDateString('ko-KR')}`}
                    {exhibition.hour && ` (${exhibition.hour})`}
                  </td>
                </tr>
              )}
              {exhibition.place && (
                <tr>
                  <th className="px-6 py-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">장소</th>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exhibition.place}</td>
                </tr>
              )}
              {exhibition.owner && (
                <tr>
                  <th className="px-6 py-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주최</th>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exhibition.owner}</td>
                </tr>
              )}
              {exhibition.charge && (
                <tr>
                  <th className="px-6 py-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관람료</th>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exhibition.charge}</td>
                </tr>
              )}
              {exhibition.homepage && (
                <tr>
                  <th className="px-6 py-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">홈페이지</th>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <a 
                      href={exhibition.homepage.startsWith('http') ? exhibition.homepage : `http://${exhibition.homepage}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {exhibition.homepage}
                    </a>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 상세 내용 */}
        {exhibition.intro && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">전시 소개</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line">{exhibition.intro}</p>
            </div>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="mt-8 flex justify-center">
          <Link href="/alljeju/external-exhibitions" className="inline-block px-6 py-3 bg-[#8046cc] text-white rounded-md hover:bg-[#6a3aad] transition-colors">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
