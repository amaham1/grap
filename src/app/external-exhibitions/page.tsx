import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function ExternalExhibitionsPage() {
  const exhibitions = await prisma.externalExhibition.findMany({
    where: { approved: true },
    orderBy: { seq: 'asc' },
  });

  return (
    <div className="p-6 bg-white min-h-screen text-gray-800">
      <h1 className="text-3xl font-bold mb-6">외부 전시회</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {exhibitions.map((ex) => (
          <div key={ex.seq} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            {ex.coverThumb && (
              <img
                src={ex.coverThumb}
                alt={ex.title}
                className="h-40 w-full object-cover rounded mb-4"
              />
            )}
            <h2 className="text-xl font-semibold mb-2">{ex.title}</h2>
            <p className="text-sm text-gray-500 mb-1">{ex.categoryName ?? ex.category}</p>
            <p className="text-sm text-gray-500 mb-4">
              {ex.startDate
                ? new Date(ex.startDate).toLocaleDateString('ko-KR')
                : '-'}{' '}
              -{' '}
              {ex.endDate
                ? new Date(ex.endDate).toLocaleDateString('ko-KR')
                : '상시'}
            </p>
            <Link
              href={`/external-exhibitions/${ex.seq}`}
              className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded shadow-md"
            >
              자세히 보기
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
