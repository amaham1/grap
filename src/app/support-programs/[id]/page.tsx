import { notFound } from 'next/navigation';
import { SupportProgram } from '@prisma/client'; // SupportProgram 모델 타입 임포트
import Link from 'next/link'; // Link 컴포넌트 임포트

interface SupportProgramDetailPageProps {
  params: {
    id: string;
  };
}

async function getSupportProgramData(id: string): Promise<SupportProgram | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const res = await fetch(`${apiUrl}/api/support-programs/${id}`, {
    cache: 'no-store', // 매번 최신 데이터 요청
  });

  if (!res.ok) {
    if (res.status === 404) {
      return null; // 404 에러 시 null 반환
    }
    console.error(`Failed to fetch support program ${id}: ${res.status} ${res.statusText}`);
    throw new Error('Failed to fetch support program data');
  }

  return res.json();
}

// 날짜 포맷팅 함수 (유틸리티로 분리 가능)
const formatDate = (dateString: Date | string | null) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  // 유효하지 않은 날짜 처리
  if (isNaN(date.getTime())) {
    return '유효하지 않은 날짜';
  }
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default async function SupportProgramDetailPage({ params }: SupportProgramDetailPageProps) {
  const supportProgram = await getSupportProgramData(params.id);

  if (!supportProgram) {
    notFound(); // 404 페이지 렌더링
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{supportProgram.title}</h1>
      <p className="text-gray-700 mb-6 whitespace-pre-wrap">{supportProgram.description}</p> {/* 줄바꿈 유지 */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">지원 대상</h2>
          <p className="text-gray-600">{supportProgram.targetGroup || '정보 없음'}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">신청 기간</h2>
          <p className="text-gray-600">
            {formatDate(supportProgram.startDate)} ~ {formatDate(supportProgram.endDate)}
          </p>
        </div>
      </div>

      {supportProgram.link && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">관련 링크</h2>
          <a
            href={supportProgram.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all" // 긴 URL 줄바꿈 처리
          >
            {supportProgram.link}
          </a>
        </div>
      )}

      {/* 필요에 따라 추가 정보 렌더링 (예: 담당 부서 등) */}

      <div className="mt-8">
        <Link href="/" className="text-blue-600 hover:underline">
          &larr; 지원 프로그램 목록으로 돌아가기
        </Link>
      </div>
    </div>
  );
}