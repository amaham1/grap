import { notFound } from 'next/navigation';
import { Event } from '@prisma/client'; // Prisma 모델 타입 임포트

interface EventDetailPageProps {
  params: {
    id: string;
  };
}

async function getEventData(id: string): Promise<Event | null> {
  // API 경로 구성 시 환경 변수 사용 고려 (프로덕션 환경 등)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const res = await fetch(`${apiUrl}/api/events/${id}`, {
    // 필요에 따라 캐싱 전략 설정 (예: revalidate)
    cache: 'no-store', // 서버 컴포넌트에서 매번 최신 데이터 요청
  });

  if (!res.ok) {
    if (res.status === 404) {
      return null; // 404 에러 시 null 반환하여 notFound() 호출 유도
    }
    // 그 외 에러 처리 (예: 로깅)
    console.error(`Failed to fetch event ${id}: ${res.status} ${res.statusText}`);
    // 일반적인 오류 페이지를 보여주기 위해 에러 throw 가능
    throw new Error('Failed to fetch event data');
  }

  return res.json();
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const event = await getEventData(params.id);

  if (!event) {
    notFound(); // 404 페이지 렌더링
  }

  // 날짜 포맷팅 함수 (필요 시 별도 유틸리티 함수로 분리)
  const formatDate = (dateString: Date | string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
      <p className="text-gray-700 mb-6">{event.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">행사 기간</h2>
          <p className="text-gray-600">
            {formatDate(event.startDate)} ~ {formatDate(event.endDate)}
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">장소</h2>
          <p className="text-gray-600">{event.location || '온라인'}</p>
        </div>
      </div>

      {/* 필요에 따라 추가 정보 렌더링 */}
      {/* 예: event.organizer, event.category 등 */}

      <div className="mt-8">
        {/* 목록으로 돌아가기 버튼 등 추가 가능 */}
        <a href="/" className="text-blue-600 hover:underline">
          &larr; 행사 목록으로 돌아가기
        </a>
      </div>
    </div>
  );
}