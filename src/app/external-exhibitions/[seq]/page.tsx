import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Props { params: { seq: string } }

export default async function ExternalExhibitionDetailPage({ params: { seq } }: Props) {
  const id = parseInt(seq, 10);
  if (isNaN(id)) return notFound();

  const exhibition = await prisma.externalExhibition.findUnique({ where: { seq: id } });
  if (!exhibition) return notFound();

  return (
    <div className="max-w-4xl mx-auto my-8 p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">{exhibition.title}</h1>
      {exhibition.cover && (
        <img
          src={exhibition.cover}
          alt={exhibition.title}
          className="w-full h-auto object-cover rounded-md mb-6"
        />
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-gray-700">
        <div><strong>카테고리:</strong> {exhibition.categoryName ?? exhibition.category ?? '-'}</div>
        <div><strong>기간:</strong> {exhibition.startDate ? new Date(exhibition.startDate).toLocaleDateString('ko-KR') : '-'} ~ {exhibition.endDate ? new Date(exhibition.endDate).toLocaleDateString('ko-KR') : '상시'}</div>
        <div><strong>장소:</strong> {exhibition.locNames ?? exhibition.locs ?? '-'}</div>
        <div><strong>연락처:</strong> {exhibition.tel ?? '-'}</div>
      </div>
      <div className="prose prose-lg text-gray-700 whitespace-pre-wrap">
        {exhibition.intro ?? '설명 없음'}
      </div>
      <Link href="/external-exhibitions" className="inline-block mt-6 text-blue-600 hover:underline">
        ← 목록으로 돌아가기
      </Link>
    </div>
  );
}
