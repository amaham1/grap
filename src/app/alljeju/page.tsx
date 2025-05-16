import { PrismaClient } from '@prisma/client';
import { ExternalExhibition, WelfareService, JejuEvent } from '@/types';
import AllJejuHeader from '@/components/AllJejuHeader';
import AllJejuFooter from '@/components/AllJejuFooter';
import Link from 'next/link';
import Image from 'next/image';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import crypto from 'crypto';

// Prisma 클라이언트 초기화
const prisma = new PrismaClient();

// Helper function to strip HTML tags
function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}

// 복호화 함수
const decrypt = (text: string): string => {
  try {
    const key = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key-here';
    const iv = process.env.ENCRYPTION_IV || 'your-16-char-iv';
    
    const keyBuffer = Buffer.alloc(32, key, 'utf8');
    const ivBuffer = Buffer.alloc(16, iv, 'utf8');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
    let decrypted = decipher.update(text, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('복호화 오류:', error);
    return text; // 복호화 실패 시 원본 텍스트 반환
  }
};

// base64 디코딩 함수
const decodeBase64 = (str: string): string => {
  if (!str) return str;
  
  try {
    if (typeof str !== 'string') return str;
    
    // base64 문자열 패턴 확인 (A-Z, a-z, 0-9, +, /, =)
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(str)) return str;
    
    // 길이가 4의 배수인지 확인 (base64 문자열의 특징)
    if (str.length % 4 !== 0) return str;
    
    // 디코딩 시도
    const decoded = Buffer.from(str, 'base64').toString('utf8');
    
    // 디코딩된 결과가 유효한지 확인 (비어있지 않은 문자열인지)
    return decoded || str;
  } catch (error) {
    console.error('Base64 디코딩 오류:', error);
    return str;
  }
};

// 필드 복호화 함수
const decryptField = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') return String(value);
  
  // base64 디코딩 시도
  const decoded = decodeBase64(value);
  
  // 디코딩된 결과가 원본과 다르면 디코딩 성공
  if (decoded !== value) {
    return decoded;
  }
  
  // base64 디코딩이 실패하면 복호화 시도
  try {
    return decrypt(value);
  } catch (error) {
    console.error('복호화 실패:', error);
    return value;
  }
};

async function getExternalExhibitions() {
  try {
    console.log('Fetching external exhibitions...');
    
    // Raw SQL 쿼리로 데이터 가져오기
    const exhibitionsRaw = await prisma.$queryRaw`
      SELECT * FROM external_exhibition 
      WHERE approved = TRUE 
      ORDER BY seq DESC 
      LIMIT 6;
    `;
    
    console.log('Raw exhibitions data:', JSON.stringify(exhibitionsRaw, null, 2));
    
    // 복호화하여 데이터 변환
    const exhibitions = (exhibitionsRaw as any[]).map((item: any) => ({
      ...item,
      title: decryptField(item.title),
      intro: decryptField(item.intro),
      content: decryptField(item.content),
      place: decryptField(item.place),
      owner: decryptField(item.owner),
      tel: decryptField(item.tel),
      homepage: decryptField(item.homepage),
      startDate: item.start_date ? new Date(item.start_date) : null,
      endDate: item.end_date ? new Date(item.end_date) : null,
      hour: decryptField(item.hour),
      fee: decryptField(item.fee),
      coverThumb: item.cover_thumb ? decryptField(item.cover_thumb) : null,
      coverImage: item.cover_image ? decryptField(item.cover_image) : null,
      categoryName: item.category_name ? decryptField(item.category_name) : null,
      stat: decryptField(item.stat),
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      deletedAt: item.deleted_at,
      // id 필드 추가 (seq를 id로 사용)
      id: item.seq.toString(),
    }));
    
    console.log('Processed exhibitions data:', exhibitions);
    return exhibitions;
  } catch (error) {
    console.error('Error fetching external exhibitions:', error);
    return [];
  }
}

async function getWelfareServices() {
  try {
    console.log('Fetching welfare services...');
    
    // Raw SQL 쿼리로 데이터 가져오기
    const servicesRaw = await prisma.$queryRaw`
      SELECT * FROM welfare_service 
      WHERE approved = TRUE 
      ORDER BY seq DESC 
      LIMIT 6;
    `;
    
    console.log('Raw welfare services data:', JSON.stringify(servicesRaw, null, 2));
    
    // 복호화하여 데이터 변환
    const services = (servicesRaw as any[]).map((item: any) => ({
      ...item,
      name: decryptField(item.name),
      contents: decryptField(item.contents),
      target: decryptField(item.target),
      howto: decryptField(item.howto),
      tel: decryptField(item.tel),
      homepage: decryptField(item.homepage),
      address: decryptField(item.address),
      lat: item.lat ? Number(item.lat) : null,
      lng: item.lng ? Number(item.lng) : null,
      // id 필드 추가 (seq를 id로 사용)
      id: item.seq.toString(),
    }));
    
    console.log('Processed welfare services data:', services);
    return services;
  } catch (error) {
    console.error('Error fetching welfare services:', error);
    return [];
  }
}

async function getJejuEvents() {
  try {
    console.log('Fetching Jeju events...');
    
    // Raw SQL 쿼리로 데이터 가져오기
    const eventsRaw = await prisma.$queryRaw`
      SELECT * FROM jeju_event 
      WHERE display_yn = 'Y' 
      AND start_date <= NOW() 
      AND end_date >= NOW() 
      ORDER BY start_date ASC 
      LIMIT 6;
    `;
    
    console.log('Raw Jeju events data:', JSON.stringify(eventsRaw, null, 2));
    
    // 복호화하여 데이터 변환
    const events = (eventsRaw as any[]).map((item: any) => ({
      ...item,
      title: decryptField(item.title),
      contents: decryptField(item.contents),
      place: decryptField(item.place),
      organizer: decryptField(item.organizer),
      tel: decryptField(item.tel),
      homepage: decryptField(item.homepage),
      startDate: item.start_date ? new Date(item.start_date) : null,
      endDate: item.end_date ? new Date(item.end_date) : null,
      writeDate: item.write_date ? new Date(item.write_date) : null,
      // id 필드 추가 (seq를 id로 사용)
      id: item.seq.toString(),
    }));
    
    console.log('Processed Jeju events data:', events);
    return events;
  } catch (error) {
    console.error('Error fetching Jeju events:', error);
    return [];
  }
}

// Generic Card Component for displaying list items
function DataCard({ item, type }: { item: any, type: string }) {
  let title: string = '제목 없음';
  let description: string | null = null;
  let dateInfo: React.ReactNode | string | null = null;
  let linkHref: string = '#';
  const key = `${type}-${item.id || item.seq}`; // Use id first, fallback to seq if needed

  // 이미지 URL 설정 (커버 이미지가 있으면 사용, 없으면 기본 이미지)
  let imageUrl = `/images/${type}-placeholder.jpg`;
  if (type === 'exhibition' && item.coverThumb) {
    imageUrl = item.coverThumb.startsWith('http') ? item.coverThumb : `https://${item.coverThumb}`;
  }

  // 추가 정보 표시를 위한 변수 (exhibition 타입 전용)
  let categoryDisplay: React.ReactNode | null = null;
  let ownerDisplay: React.ReactNode | null = null;
  let statusDisplay: React.ReactNode | null = null;

  // Determine display details based on type
  switch (type) {
    case 'exhibition':
      title = item.title;
      description = item.intro;
      dateInfo = (
        <>
          {item.startDate ? new Date(item.startDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '날짜 정보 없음'}
          {item.endDate && item.startDate !== item.endDate && ` ~ ${new Date(item.endDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`}
          {item.hour && ` (${item.hour})`}
        </>
      );
      linkHref = `/alljeju/external-exhibitions/${item.id}`; // Use id

      // categoryName 표시
      if (item.categoryName) {
        categoryDisplay = (
          <span className="inline-block bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-purple-900 dark:text-purple-300">
            {item.categoryName}
          </span>
        );
      }

      // owner 표시
      if (item.owner) {
        ownerDisplay = <span className="text-gray-600">주최: {item.owner}</span>;
      }

      // stat (상태) 표시
      if (item.stat) {
        let statText = item.stat;
        let statColorClasses = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'; // 기본값
        if (item.stat.toUpperCase() === 'ING' || item.stat.toUpperCase() === 'PLAN') {
          statText = item.stat.toUpperCase() === 'ING' ? '진행중' : '예정';
          statColorClasses = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        } else if (item.stat.toUpperCase() === 'END') {
          statText = '종료';
          statColorClasses = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        }
        statusDisplay = (
          <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${statColorClasses}`}>
            {statText}
          </span>
        );
      }
      break;
    case 'welfare':
      title = item.name;
      description = stripHtml(item.contents); // HTML 태그 제거
      dateInfo = `지역: ${item.allLoc ? '전체' : ''}${item.jejuLoc ? ' 제주시' : ''}${item.seogwipoLoc ? ' 서귀포시' : ''}`;
      linkHref = `/alljeju/welfare-services/${item.id}`; // Use id
      break;
    case 'jeju':
      title = item.title;
      description = stripHtml(item.contents); // HTML 태그 제거
      dateInfo = `작성일: ${item.writeDate ? new Date(item.writeDate).toLocaleDateString('ko-KR') : 'N/A'}`;
      linkHref = `/alljeju/jeju-events/${item.id}`; // Use id
      break;
  }

  return (
    <div key={key} className="group">
      <Link href={linkHref} className="block">
        {/* Conditionally render the image container only if type is not 'welfare' and not 'jeju' */}
        {type !== 'welfare' && type !== 'jeju' && (
          <div className="relative overflow-hidden rounded-lg mb-3 bg-gray-50 aspect-square shadow-md group-hover:shadow-lg transition-shadow duration-300">
            {type === 'exhibition' && item.coverThumb ? (
              <Image
                src={item.coverThumb}
                alt={title}
                fill
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              // Default placeholder for other non-welfare types without specific images
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center p-4 w-full h-full">
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md group-hover:bg-gray-50 transition-colors duration-300">
                    <span className="text-sm">이미지 준비 중</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="px-1">
          <h3 className="text-base font-semibold text-gray-800 group-hover:text-primary transition-colors duration-300 mb-1 truncate">
            {title}
          </h3>
          <div className="text-xs text-gray-500 mb-2 min-h-[3em] line-clamp-2">
            {description}
          </div>

          {/* 날짜 정보 */}
          {dateInfo && (
            <div className="text-xs text-gray-400 mt-1">
              {dateInfo}
            </div>
          )}
          {/* Exhibition 추가 정보 표시 */}
          {type === 'exhibition' && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center space-x-2">
                {categoryDisplay}
                {statusDisplay}
              </div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

// DataSection 컴포넌트 정의
function DataSection({
  id,
  title,
  description,
  data = [],
  type,
  color = 'indigo',
  viewAllHref
}: {
  id: string;
  title: string;
  description?: string;
  data: any[];
  type: 'exhibition' | 'welfare' | 'jeju';
  color?: 'indigo' | 'emerald' | 'blue' | 'gray';
  viewAllHref: string;
}) {
  const count = data?.length ?? 0;
  
  // Tailwind CSS 클래스 생성 - 직접 색상 클래스 사용
  const getBadgeClasses = (color: string) => {
    switch(color) {
      case 'indigo': return 'bg-indigo-100 text-indigo-800';
      case 'emerald': return 'bg-emerald-100 text-emerald-800';
      case 'blue': return 'bg-blue-100 text-blue-800';
      case 'gray': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getButtonClasses = (color: string) => {
    switch(color) {
      case 'indigo': return 'bg-indigo-600 hover:bg-indigo-700';
      case 'emerald': return 'bg-emerald-600 hover:bg-emerald-700';
      case 'blue': return 'bg-blue-600 hover:bg-blue-700';
      case 'gray': return 'bg-gray-600 hover:bg-gray-700';
      default: return 'bg-gray-600 hover:bg-gray-700';
    }
  };
  
  const badgeClasses = getBadgeClasses(color);
  const buttonClasses = getButtonClasses(color);
  
  if (!data || data.length === 0) {
    return (
      <section id={id} className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {title}
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              현재 등록된 {title}이(가) 없습니다.
            </p>
          </div>
        </div>
      </section>
    );
  }
  
  // 데이터 타입 가드 함수
  const isExternalExhibition = (item: any): item is ExternalExhibition => {
    return type === 'exhibition';
  };
  
  const isWelfareService = (item: any): item is WelfareService => {
    return type === 'welfare';
  };
  
  const isJejuEvent = (item: any): item is JejuEvent => {
    return type === 'jeju';
  };
  
  // 데이터 로깅 추가
  console.log(`[${title}] 데이터:`, data);
  
  // 버튼 색상 클래스 매핑
  const buttonColorMap = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    gray: 'bg-gray-600 hover:bg-gray-700'
  };

  const buttonClasses = buttonColorMap[color] || buttonColorMap.indigo;

  return (
    <section id={id} className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            최근 등록된 {title}을(를) 확인해보세요.
          </p>
        </div>
        
        <div className="mt-12">
          {data.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {data.slice(0, 3).map((item) => {
                  if (isExternalExhibition(item) || isWelfareService(item) || isJejuEvent(item)) {
                    return (
                      <DataCard 
                        key={item.id} 
                        item={item} 
                        type={type} 
                      />
                    );
                  }
                  return null;
                })}
              </div>
              
              <div className="mt-10 text-center">
                <Link 
                  href={`/alljeju/${type === 'exhibition' ? 'external-exhibitions' : type === 'welfare' ? 'welfare-services' : 'jeju-events'}`}
                  className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${buttonClasses}`}
                >
                  더보기
                  <svg className="ml-2 -mr-1 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {emptyMessage || '등록된 데이터가 없습니다.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// --- Main Page Component ---
export default async function AllJejuPage() {
  console.log('Rendering AllJejuPage...');
  
  let externalExhibitions = [];
  let welfareServices = [];
  let jejuEvents = [];
  
  try {
    console.log('데이터를 가져오기 시작합니다...');
    
    // 병렬로 데이터 가져오기
    [externalExhibitions, welfareServices, jejuEvents] = await Promise.all([
      getExternalExhibitions().catch(e => {
        console.error('외부 전시회 데이터 가져오기 실패:', e);
        return [];
      }),
      getWelfareServices().catch(e => {
        console.error('복지 서비스 데이터 가져오기 실패:', e);
        return [];
      }),
      getJejuEvents().catch(e => {
        console.error('제주 행사 데이터 가져오기 실패:', e);
        return [];
      })
    ]);
    
    console.log('데이터 로드 완료:', {
      externalExhibitions: externalExhibitions?.length,
      welfareServices: welfareServices?.length,
      jejuEvents: jejuEvents?.length
    });
  } catch (error) {
    console.error('데이터 가져오기 중 오류 발생:', error);
    // 오류가 발생해도 빈 배열로 계속 진행
  }
  
  // 데이터가 없을 때 빈 배열로 초기화
  const safeExternalExhibitions = Array.isArray(externalExhibitions) ? externalExhibitions : [];
  const safeWelfareServices = Array.isArray(welfareServices) ? welfareServices : [];
  const safeJejuEvents = Array.isArray(jejuEvents) ? jejuEvents : [];

  console.log('데이터 로드 완료 (클라이언트):', {
    externalExhibitions: safeExternalExhibitions.length,
    welfareServices: safeWelfareServices.length,
    jejuEvents: safeJejuEvents.length
  });

  // 섹션 데이터
  const sections = [
    {
      id: 'exhibitions',
      title: '외부 전시회',
      data: safeExternalExhibitions,
      type: 'exhibition' as const,
      color: 'indigo' as const,
      viewAllHref: '/alljeju/external-exhibitions',
      emptyMessage: '등록된 전시회가 없습니다.'
    },
    {
      id: 'welfare',
      title: '복지 서비스',
      data: safeWelfareServices,
      type: 'welfare' as const,
      color: 'emerald' as const,
      viewAllHref: '/alljeju/welfare-services',
      emptyMessage: '등록된 복지 서비스가 없습니다.'
    },
    {
      id: 'events',
      title: '제주 행사',
      data: safeJejuEvents,
      type: 'jeju' as const,
      color: 'blue' as const,
      viewAllHref: '/alljeju/jeju-events',
      emptyMessage: '등록된 제주 행사가 없습니다.'
    }
  ];
  
  try {
    // 이미 위에서 데이터를 가져왔으므로 중복 호출 제거
    console.log('페이지 렌더링을 시작합니다...');

    return (
      <div className="min-h-screen flex flex-col">
        <AllJejuHeader />
        
        <main className="flex-1">
          {/* Hero Section */}
          <div className="bg-indigo-700 text-white">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                제주도 모든 정보를 한 곳에서
              </h1>
              <p className="mt-6 max-w-3xl mx-auto text-xl text-indigo-100">
                제주도의 다양한 전시회, 복지 서비스, 행사 정보를 확인하세요.
              </p>
            </div>
          </div>

          {/* Data Sections */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {sections.map((section, index) => (
              <div key={section.id} className={index > 0 ? 'mt-16' : ''}>
                <DataSection 
                  id={section.id}
                  title={section.title}
                  data={section.data}
                  type={section.type}
                  color={section.color}
                  viewAllHref={section.viewAllHref}
                />
              </div>
            ))}
          </div>
        </main>
        
        <AllJejuFooter />
      </div>
    );
  } catch (error) {
    console.error('Error in AllJejuPage:', error);
    return (
      <div className="min-h-screen bg-gray-50">
        <AllJejuHeader />
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
          <div className="bg-white shadow rounded-lg p-8">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">오류가 발생했습니다</h2>
            <p className="mt-2 text-gray-600">데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
            <p className="mt-2 text-sm text-gray-500">오류: {error instanceof Error ? error.message : '알 수 없는 오류'}</p>
          </div>
        </div>
        <AllJejuFooter />
      </div>
    );
  }
}
