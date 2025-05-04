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
    <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* 히어로 섹션 */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">GRAP</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">행사 및 지원 프로그램 관리 플랫폼</p>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 행사 목록 섹션 */}
          <section className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">행사 목록</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                {events?.length || 0}개
              </span>
            </div>
            <div className="p-6">
              {events === null ? (
                <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                  <p className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    행사 목록을 불러오는 중 오류가 발생했습니다.
                  </p>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">등록된 행사가 없습니다.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {events.map((event: Event) => (
                    <li key={event.id} className="py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-md">
                      <Link href={`/events/${event.id}`} className="block">
                        <div className="px-2">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{event.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{event.description}</p>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <span>
                              {new Date(event.startDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                              {event.endDate && ` ~ ${new Date(event.endDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* 지원 프로그램 목록 섹션 */}
          <section className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">지원 프로그램</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                {supportPrograms?.length || 0}개
              </span>
            </div>
            <div className="p-6">
              {supportPrograms === null ? (
                <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                  <p className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    지원 프로그램 목록을 불러오는 중 오류가 발생했습니다.
                  </p>
                </div>
              ) : supportPrograms.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">등록된 지원 프로그램이 없습니다.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {supportPrograms.map((program) => (
                    <li key={program.id} className="py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-md">
                      <Link href={`/support-programs/${program.id}`} className="block">
                        <div className="px-2">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{program.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{program.description}</p>
                          <div className="flex flex-col space-y-1 text-xs">
                            <div className="flex items-center text-gray-500 dark:text-gray-400">
                              <svg className="flex-shrink-0 mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                              </svg>
                              <span>대상: {program.targetGroup}</span>
                            </div>
                            <div className="flex items-center text-gray-500 dark:text-gray-400">
                              <svg className="flex-shrink-0 mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              <span>
                                신청 기간: {program.startDate ? new Date(program.startDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                                {program.endDate && ` ~ ${new Date(program.endDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
