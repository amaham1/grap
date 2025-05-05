import {
  Event,
  SupportProgram,
  ExternalExhibition, // Added
  WelfareService,     // Added
  JejuEvent,          // Added
  JunoldaEvent,       // Added
} from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

// --- Data Fetching Functions ---

async function getEvents(): Promise<Event[] | null> {
  try {
    // 최신 이벤트 6개만 가져오도록 limit 추가 (예시)
    return await prisma.event.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return null;
  }
}

async function getSupportPrograms(): Promise<SupportProgram[] | null> {
  try {
    // 예시: 최신 6개
    return await prisma.supportProgram.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
  } catch (error) {
    console.error('Error fetching support programs:', error);
    return null;
  }
}

async function getExternalExhibitions(): Promise<ExternalExhibition[] | null> {
  try {
    // 예시: 최신 6개
    return await prisma.externalExhibition.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
  } catch (error) {
    console.error('Error fetching external exhibitions:', error);
    return null;
  }
}

async function getWelfareServices(): Promise<WelfareService[] | null> {
  try {
    // 예시: 최신 6개
    return await prisma.welfareService.findMany({
      where: { approved: true },
      // welfare-services/page.tsx 에서는 seq 로 정렬했었으므로 맞춰줌 (필요시 변경)
      orderBy: { seq: 'asc' }, 
      take: 6,
    });
  } catch (error) {
    console.error('Error fetching welfare services:', error);
    return null;
  }
}

async function getJejuEvents(): Promise<JejuEvent[] | null> {
  try {
    // 예시: 최신 6개
    return await prisma.jejuEvent.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
  } catch (error) {
    console.error('Error fetching Jeju events:', error);
    return null;
  }
}

async function getJunoldaEvents(): Promise<JunoldaEvent[] | null> {
  try {
    // 예시: 최신 6개
    return await prisma.junoldaEvent.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
  } catch (error) {
    console.error('Error fetching Junolda events:', error);
    return null;
  }
}

// --- Helper Components ---

// Generic Card Component for displaying list items
function DataCard({ item, type }: { item: any, type: string }) {
  let title: string = '제목 없음';
  let description: string | null = null;
  let dateInfo: React.ReactNode | string | null = null;
  let linkHref: string = '#';
  const key = `${type}-${item.id || item.seq}`; // Use id first, fallback to seq if needed

  // 임시 이미지 URL (실제 데이터에 이미지가 있다면 그것을 사용)
  const imageUrl = `/images/${type}-placeholder.jpg`;
  
  // Determine display details based on type
  switch (type) {
    case 'event':
      title = item.title;
      description = item.description;
      dateInfo = (
        <>
          {new Date(item.startDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          {item.endDate && ` ~ ${new Date(item.endDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`}
        </>
      );
      linkHref = `/events/${item.id}`;
      break;
    case 'support':
      title = item.title;
      description = item.description;
      dateInfo = (
        <div className="text-xs">
          <div className="text-gray-500">
            <span>대상: {item.targetGroup || 'N/A'}</span>
          </div>
          <div className="text-gray-500">
            <span>
               신청 기간: {item.startDate ? new Date(item.startDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
               {item.endDate && ` ~ ${new Date(item.endDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`}
            </span>
          </div>
        </div>
      );
      linkHref = `/support-programs/${item.id}`;
      break;
    case 'exhibition':
      title = item.title;
      description = item.intro;
      dateInfo = (
        <>
          {item.startDate ? new Date(item.startDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
          {item.endDate && ` ~ ${new Date(item.endDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`}
          {item.hour && ` (${item.hour})`}
        </>
      );
      linkHref = `/external-exhibitions/${item.id}`; // Use id
      break;
    case 'welfare':
      title = item.name;
      description = item.contents;
      dateInfo = `지역: ${item.allLoc ? '전체' : ''}${item.jejuLoc ? ' 제주시' : ''}${item.seogwipoLoc ? ' 서귀포시' : ''}`;
      linkHref = `/welfare-services/${item.id}`; // Use id
      break;
    case 'jeju':
      title = item.title;
      description = item.contents;
      dateInfo = `작성일: ${item.writeDate ? new Date(item.writeDate).toLocaleDateString('ko-KR') : 'N/A'}`;
      linkHref = `/jeju-events/${item.id}`; // Use id
      break;
    case 'junolda':
      title = item.title;
      description = item.contents;
      dateInfo = `시작일: ${item.writeDate ? new Date(item.writeDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}`;
      linkHref = `/junolda-events/${item.id}`; // Use id
      break;
  }

  return (
    <div key={key} className="group">
      <Link href={linkHref} className="block">
        <div className="relative overflow-hidden rounded-lg mb-3 bg-gray-50 aspect-square shadow-md group-hover:shadow-lg transition-shadow duration-300">
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            {/* 실제 이미지가 있다면 Image 컴포넌트 사용 */}
            {/* <Image 
              src={imageUrl} 
              alt={title} 
              width={300} 
              height={300} 
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            /> */}
            <div className="text-center p-4 w-full h-full">
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md group-hover:bg-gray-50 transition-colors duration-300">
                <span className="text-sm">이미지 준비 중</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-1">
          <h3 className="text-base font-semibold text-gray-800 group-hover:text-primary transition-colors duration-300 mb-1 truncate">
            {title}
          </h3>
          <div className="text-xs text-gray-500 mb-2 min-h-[3em] line-clamp-2">
            {description}
          </div>

          {/* 날짜 정보 */}
          {dateInfo && (
            <div className="text-xs text-gray-600 mb-2">
              {dateInfo}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

// Section Component to display a category of data
function DataSection({ title, data, type, color = 'gray', id }: { title: string, data: any[] | null, type: string, color?: string, id?: string }) {
  const count = data?.length ?? 0;
  // Tailwind CSS class generation (ensure colors are defined in tailwind.config.js or use default grays)
  const badgeClasses = `bg-${color}-100 text-${color}-800`;

  return (
    <section id={id} className="py-8 first:pt-4 last:pb-0 scroll-mt-20"> 
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          {title}
          {count > 0 && (
            <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${badgeClasses}`}>
              {count}
            </span>
          )}
        </h2>
        {count > 0 && (
          <Link href={`/${type === 'event' ? 'events' : type === 'support' ? 'support-programs' : type === 'exhibition' ? 'external-exhibitions' : type === 'welfare' ? 'welfare-services' : type === 'jeju' ? 'jeju-events' : 'junolda-events'}`} 
                className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
            더보기 &rarr;
          </Link>
        )}
      </div>

      {count > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {data?.map((item) => (
            <DataCard key={`${type}-${item.id || item.seq}`} item={item} type={type} />
          ))}
        </div>
      ) : (
        <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <DocumentMagnifyingGlassIcon className="h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">데이터가 없습니다</h3>
          <p className="text-sm text-gray-600 max-w-md">
            {type === 'event' ? '이벤트' : 
             type === 'support' ? '지원 프로그램' : 
             type === 'exhibition' ? '외부 전시회' : 
             type === 'welfare' ? '복지 서비스' : 
             type === 'jeju' ? '제주 행사' : '전시문화 행사'} 데이터가 아직 등록되지 않았습니다.
          </p>
        </div>
      )}
    </section>
  );
}

// Import Heroicons (replace with actual import paths if different)
import { CalendarIcon, MapPinIcon, UserGroupIcon, ExclamationTriangleIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline'; // Or solid


// --- Main Page Component ---

export default async function HomePage() {
  // Fetch data for all sections
  const [events, supportPrograms, externalExhibitions, welfareServices, jejuEvents, junoldaEvents] = await Promise.all([
    getEvents(),
    getSupportPrograms(),
    getExternalExhibitions(),
    getWelfareServices(),
    getJejuEvents(),
    getJunoldaEvents()
  ]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 상단 배너 영역 */}
      <div className="bg-gradient-to-r from-pink-50 to-blue-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">GRAP</h1>
              <p className="text-lg text-gray-600">제주도 전시문화 정보 제공 사이트입니다.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 카테고리 네비게이션 */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto py-4 scrollbar-hide">
            <div className="flex space-x-8">
              <a href="#section-exhibition" className="text-gray-500 hover:text-primary border-b-2 border-transparent hover:border-primary px-1 py-2 text-sm font-medium whitespace-nowrap transition-colors">전시회</a>
              <a href="#section-welfare" className="text-gray-500 hover:text-primary border-b-2 border-transparent hover:border-primary px-1 py-2 text-sm font-medium whitespace-nowrap transition-colors">복지 서비스</a>
              <a href="#section-jeju" className="text-gray-500 hover:text-primary border-b-2 border-transparent hover:border-primary px-1 py-2 text-sm font-medium whitespace-nowrap transition-colors">제주 행사</a>
              <a href="#section-junolda" className="text-gray-500 hover:text-primary border-b-2 border-transparent hover:border-primary px-1 py-2 text-sm font-medium whitespace-nowrap transition-colors">전시문화 행사</a>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          <DataSection id="section-exhibition" title="전시회" data={externalExhibitions} type="exhibition" color="purple" />
          <DataSection id="section-welfare" title="복지 서비스" data={welfareServices} type="welfare" color="indigo" />
          <DataSection id="section-jeju" title="제주 행사" data={jejuEvents} type="jeju" color="pink" />
          <DataSection id="section-junolda" title="전시문화 행사" data={junoldaEvents} type="junolda" color="yellow" />
        </div>
      </div>
    </div>
  );
}
