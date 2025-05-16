import Link from 'next/link';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import DataCard from '@/components/DataCard';
import { ExternalExhibition, WelfareService, JejuEvent, DataSectionProps } from '@/types';

type ItemType = ExternalExhibition | WelfareService | JejuEvent;

export default function DataSection({ 
  title, 
  data, 
  type, 
  color = 'gray', 
  id 
}: DataSectionProps) {
  // 색상 클래스 매핑
  const colorClasses = {
    indigo: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-800',
      button: 'bg-indigo-600 hover:bg-indigo-700',
    },
    emerald: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      button: 'bg-emerald-600 hover:bg-emerald-700',
    },
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
    gray: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      button: 'bg-gray-600 hover:bg-gray-700',
    },
  };

  // 색상 클래스 가져오기
  const { bg, text, button } = colorClasses[color as keyof typeof colorClasses] || colorClasses.gray;

  // 데이터가 없을 때 표시할 메시지
  const getEmptyMessage = () => {
    switch (type) {
      case 'exhibition':
        return '외부 전시회';
      case 'welfare':
        return '복지 서비스';
      case 'jeju':
        return '제주 행사';
      default:
        return '전시문화 행사';
    }
  };

  // 링크 경로 가져오기
  const getLinkPath = () => {
    switch (type) {
      case 'exhibition':
        return '/alljeju/external-exhibitions';
      case 'welfare':
        return '/alljeju/welfare-services';
      case 'jeju':
        return '/alljeju/jeju-events';
      default:
        return '#';
    }
  };

  if (!data || data.length === 0) {
    return (
      <section id={id} className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <DocumentMagnifyingGlassIcon className="h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">데이터가 없습니다</h3>
            <p className="text-sm text-gray-600 max-w-md">
              {getEmptyMessage()} 데이터가 아직 등록되지 않았습니다.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id={id} className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <span className={`text-base font-semibold tracking-wide uppercase ${text} ${bg} px-3 py-1 rounded-full`}>
            {title}
          </span>
          <h2 className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            다양한 {title}을 확인해보세요
          </h2>
        </div>
        
        <div className="mt-10">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((item: ItemType) => (
              <DataCard 
                key={`${type}-${item.id}`} 
                item={item} 
                type={type as 'exhibition' | 'welfare' | 'jeju'} 
              />
            ))}
          </div>
          
          {data.length > 0 && (
            <div className="mt-10 text-center">
              <Link 
                href={getLinkPath()}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${button}`}
              >
                더보기
                <svg className="ml-2 -mr-1 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
