// src/app/page.tsx (Tailwind CSS 적용 후)
import { Event, SupportProgram } from '@prisma/client';
import Link from 'next/link'; // Link 컴포넌트 임포트

async function getEvents(): Promise<Event[] | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch events: ${res.statusText}`);
    }
    const events: Event[] = await res.json();
    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    return null;
  }
}

async function getSupportPrograms(): Promise<SupportProgram[] | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/support-programs`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch support programs: ${res.statusText}`);
    }
    const supportPrograms: SupportProgram[] = await res.json();
    return supportPrograms;
  } catch (error) {
    console.error('Error fetching support programs:', error);
    return null;
  }
}

export default async function HomePage() {
  const [events, supportPrograms] = await Promise.all([
    getEvents(),
    getSupportPrograms()
  ]);

  return (
    // 전체 레이아웃: 컨테이너, 자동 마진, 좌우 패딩, 상하 패딩, flex 컬럼, 항목 간 간격
    <main className="container mx-auto px-4 py-8 flex flex-col gap-8">
      {/* 행사 목록 섹션: 패딩, 둥근 모서리, 배경색 (라이트/다크), 하단 마진 */}
      <section className="p-6 rounded-lg bg-gray-50 dark:bg-gray-800 mb-8">
        {/* 섹션 제목: 텍스트 크기, 굵기, 하단 마진, 텍스트 색상 (라이트/다크) */}
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">행사 목록</h1>
        {events === null ? (
          <p className="text-red-500">행사 목록을 불러오는 중 오류가 발생했습니다.</p>
        ) : events.length === 0 ? (
          // 빈 목록 메시지: 텍스트 색상 (라이트/다크)
          <p className="text-gray-500 dark:text-gray-400">등록된 행사가 없습니다.</p>
        ) : (
          // 목록: 항목 간 세로 간격
          <ul className="space-y-4">
            {events.map((event: Event) => ( // event 타입을 명시적으로 지정
              // 목록 아이템 li 태그 유지, key 속성 li에 적용
              <li key={event.id} className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                {/* Link 컴포넌트로 내용 감싸기 */}
                <Link href={`/events/${event.id}`} className="block p-4"> {/* Link에 block과 padding 적용 */}
                  {/* 아이템 제목 */}
                  <h2 className="text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">{event.title}</h2>
                  {/* 아이템 설명 */}
                  <p className="text-gray-700 dark:text-gray-300 mb-2">{event.description}</p> {/* 설명 아래 마진 추가 */}
                  {/* 아이템 날짜 */}
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {/* 날짜 포맷팅 개선 */}
                    시작: {new Date(event.startDate).toLocaleDateString('ko-KR')}
                    {event.endDate && ` ~ ${new Date(event.endDate).toLocaleDateString('ko-KR')}`} {/* 종료일이 있으면 표시 */}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 지원 프로그램 목록 섹션: 패딩, 둥근 모서리, 배경색 (라이트/다크) */}
      <section className="p-6 rounded-lg bg-gray-50 dark:bg-gray-800">
        {/* 섹션 제목: 텍스트 크기, 굵기, 하단 마진, 텍스트 색상 (라이트/다크) */}
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">지원 프로그램 목록</h1>
        {supportPrograms === null ? (
          <p className="text-red-500">지원 프로그램 목록을 불러오는 중 오류가 발생했습니다.</p>
        ) : supportPrograms.length === 0 ? (
          // 빈 목록 메시지: 텍스트 색상 (라이트/다크)
          <p className="text-gray-500 dark:text-gray-400">등록된 지원 프로그램이 없습니다.</p>
        ) : (
          // 목록: 항목 간 세로 간격
          <ul className="space-y-4">
            {supportPrograms.map((program) => (
              // 목록 아이템: 테두리 (라이트/다크), 둥근 모서리, 그림자, 배경색 (라이트/다크), 호버 효과
              <li key={program.id} className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                {/* Link 컴포넌트로 내용 감싸기 */}
                <Link href={`/support-programs/${program.id}`} className="block p-4"> {/* Link에 block과 padding 적용 */}
                  {/* 아이템 제목: 텍스트 크기, 굵기, 하단 마진, 텍스트 색상 (라이트/다크) */}
                  <h2 className="text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">{program.title}</h2>
                  {/* 아이템 설명: 텍스트 색상 (라이트/다크), 하단 마진 추가 */}
                  <p className="text-gray-700 dark:text-gray-300 mb-2">{program.description}</p>
                  {/* 아이템 대상 그룹: 텍스트 크기, 텍스트 색상 (라이트/다크) */}
                  <p className="text-sm text-gray-500 dark:text-gray-400">대상: {program.targetGroup}</p>
                  {/* 신청 기간 추가 (null 처리) */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    신청 기간: {program.startDate ? new Date(program.startDate).toLocaleDateString('ko-KR') : 'N/A'}
                    {program.endDate && ` ~ ${new Date(program.endDate).toLocaleDateString('ko-KR')}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
