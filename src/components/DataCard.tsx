import Image from 'next/image';
import Link from 'next/link';
import { CalendarIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { ExternalExhibition, WelfareService, JejuEvent } from '@/types';

type ItemType = ExternalExhibition | WelfareService | JejuEvent;

interface DataCardProps {
  item: ItemType;
  type: 'exhibition' | 'welfare' | 'jeju';
}

// 타입 가드 함수들
function isExternalExhibition(item: ItemType): item is ExternalExhibition {
  return (item as ExternalExhibition).intro !== undefined;
}

function isWelfareService(item: ItemType): item is WelfareService {
  return (item as WelfareService).howto !== undefined;
}

function isJejuEvent(item: ItemType): item is JejuEvent {
  return (item as JejuEvent).organizer !== undefined;
}

export default function DataCard({ item, type }: DataCardProps) {
  // Helper function to strip HTML tags
  const stripHtml = (html: string | null | undefined): string => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };
  // 공통 속성
  let title = '제목 없음';
  let description: string | null = null;
  let dateInfo: React.ReactNode = '날짜 정보 없음';
  let linkHref = '#';
  let imageUrl = `/images/${type}-placeholder.jpg`;
  
  // 추가 정보 표시를 위한 변수
  let categoryDisplay: React.ReactNode = null;
  let ownerDisplay: React.ReactNode = null;
  let statusDisplay: React.ReactNode = null;
  let locationDisplay: React.ReactNode = null;

  // 타입에 따른 데이터 처리
  if (isExternalExhibition(item)) {
    // 외부 전시회 데이터 처리
    title = item.title || '제목 없음';
    description = item.intro ? stripHtml(item.intro).substring(0, 100) + '...' : null;
    
    const startDate = item.startDate ? new Date(item.startDate) : null;
    const endDate = item.endDate ? new Date(item.endDate) : null;
    
    dateInfo = (
      <>
        {startDate ? startDate.toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) : '날짜 정보 없음'}
        {endDate && startDate && startDate.getTime() !== endDate.getTime() && (
          ` ~ ${endDate.toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}`
        )}
        {item.hour && ` (${item.hour})`}
      </>
    );
    
    linkHref = `/alljeju/external-exhibitions/${item.id}`;

    // 이미지 URL 설정
    if (item.coverThumb) {
      imageUrl = item.coverThumb.startsWith('http') 
        ? item.coverThumb 
        : `https://${item.coverThumb}`;
    }

    // 카테고리 표시
    if (item.categoryName) {
      categoryDisplay = (
        <span className="inline-block bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {item.categoryName}
        </span>
      );
    }

    // 주최자 표시
    if (item.owner) {
      ownerDisplay = (
        <div className="flex items-center text-sm text-gray-500">
          <UserGroupIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
          <span>{item.owner}</span>
        </div>
      );
    }

    // 장소 표시
    if (item.place) {
      locationDisplay = (
        <div className="flex items-center text-sm text-gray-500 mt-1">
          <MapPinIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
          <span>{item.place}</span>
        </div>
      );
    }

    // 상태 표시
    if (item.stat) {
      let statusClass = 'bg-gray-100 text-gray-800';
      if (item.stat === '진행중') {
        statusClass = 'bg-green-100 text-green-800';
      } else if (item.stat === '종료') {
        statusClass = 'bg-red-100 text-red-800';
      }
      
      statusDisplay = (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
          {item.stat}
        </span>
      );
    }
  } 
  else if (isWelfareService(item)) {
    // 복지 서비스 데이터 처리
    title = item.name || '제목 없음';
    description = item.contents ? stripHtml(item.contents).substring(0, 100) + '...' : null;
    dateInfo = '상시 운영';
    linkHref = `/alljeju/welfare-services/${item.id}`;
    
    // 장소 표시
    if (item.address) {
      locationDisplay = (
        <div className="flex items-center text-sm text-gray-500 mt-1">
          <MapPinIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
          <span>{item.address}</span>
        </div>
      );
    }
  } 
  else if (isJejuEvent(item)) {
    // 제주 행사 데이터 처리
    title = item.title || '제목 없음';
    description = item.contents ? stripHtml(item.contents).substring(0, 100) + '...' : null;
    dateInfo = item.writeDate 
      ? new Date(item.writeDate).toLocaleDateString('ko-KR') 
      : '날짜 정보 없음';
    linkHref = item.homepage || '#';
    
    // 장소 표시
    if (item.place) {
      locationDisplay = (
        <div className="flex items-center text-sm text-gray-500 mt-1">
          <MapPinIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
          <span>{item.place}</span>
        </div>
      );
    }
  }

  return (
    <div className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
      <Link href={linkHref} className="block h-full flex flex-col">
        {/* 이미지 영역 - welfare 타입이 아니고 이미지가 있을 때만 표시 */}
        {type !== 'welfare' && (
          <div className="relative h-48 overflow-hidden bg-gray-100">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            />
          </div>
        )}
        
        {/* 내용 영역 */}
        <div className="p-4 flex-1 flex flex-col">
          {/* 제목과 상태 */}
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{title}</h3>
            {statusDisplay}
          </div>
          
          {/* 카테고리 */}
          {categoryDisplay && <div className="mb-2">{categoryDisplay}</div>}
          
          {/* 날짜 정보 */}
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
            <span>{dateInfo}</span>
          </div>
          
          {/* 장소 정보 */}
          {locationDisplay}
          
          {/* 주최자 정보 */}
          {ownerDisplay}
          
          {/* 설명 */}
          {description && (
            <p className="mt-3 text-gray-600 text-sm line-clamp-3">
              {description}
            </p>
          )}
          
          {/* 더보기 링크 */}
          <div className="mt-4 pt-4 border-t border-gray-100 text-right">
            <span className="text-indigo-600 text-sm font-medium group-hover:text-indigo-800 transition-colors">
              자세히 보기 →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
