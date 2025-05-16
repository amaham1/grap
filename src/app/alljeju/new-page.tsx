import { PrismaClient } from '@prisma/client';
import { ExternalExhibition, WelfareService, JejuEvent } from '@/types';
import DataSection from '@/components/DataSection';
import AllJejuHeader from '@/components/AllJejuHeader';
import AllJejuFooter from '@/components/AllJejuFooter';
import { decryptField } from '@/lib/encryption';

// Prisma 클라이언트 초기화
const prisma = new PrismaClient();

// HTML 태그 제거 헬퍼 함수
function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}

// 외부 전시회 데이터 가져오기
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
      id: item.seq.toString(),
    }));
    
    console.log('Processed exhibitions data:', exhibitions);
    return exhibitions;
  } catch (error) {
    console.error('Error fetching external exhibitions:', error);
    return [];
  }
}

// 복지 서비스 데이터 가져오기
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
      lat: item.lat ? parseFloat(item.lat) : null,
      lng: item.lng ? parseFloat(item.lng) : null,
      id: item.seq.toString(),
    }));
    
    console.log('Processed welfare services data:', services);
    return services;
  } catch (error) {
    console.error('Error fetching welfare services:', error);
    return [];
  }
}

// 제주 행사 데이터 가져오기
async function getJejuEvents() {
  try {
    console.log('Fetching Jeju events...');
    
    // Raw SQL 쿼리로 데이터 가져오기
    const eventsRaw = await prisma.$queryRaw`
      SELECT * FROM jeju_event 
      WHERE approved = TRUE 
      ORDER BY seq DESC 
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
      id: item.seq.toString(),
    }));
    
    console.log('Processed Jeju events data:', events);
    return events;
  } catch (error) {
    console.error('Error fetching Jeju events:', error);
    return [];
  }
}

// 메인 페이지 컴포넌트
export default async function AllJejuPage() {
  console.log('Rendering AllJejuPage...');
  
  try {
    // 모든 데이터 병렬로 가져오기
    const [externalExhibitions, welfareServices, jejuEvents] = await Promise.all([
      getExternalExhibitions(),
      getWelfareServices(),
      getJejuEvents(),
    ]);
    
    console.log('All data loaded:', {
      exhibitions: externalExhibitions,
      services: welfareServices,
      events: jejuEvents,
    });
    
    return (
      <div className="min-h-screen flex flex-col">
        <AllJejuHeader />
        
        <main className="flex-grow">
          {/* 외부 전시회 섹션 */}
          <DataSection 
            title="외부 전시회" 
            data={externalExhibitions}
            type="exhibition"
            color="indigo"
            id="exhibitions"
          />
          
          {/* 복지 서비스 섹션 */}
          <DataSection 
            title="복지 서비스" 
            data={welfareServices}
            type="welfare"
            color="emerald"
            id="welfare"
          />
          
          {/* 제주 행사 섹션 */}
          <DataSection 
            title="제주 행사" 
            data={jejuEvents}
            type="jeju"
            color="blue"
            id="events"
          />
        </main>
        
        <AllJejuFooter />
      </div>
    );
  } catch (error) {
    console.error('Error in AllJejuPage:', error);
    
    return (
      <div className="min-h-screen flex flex-col">
        <AllJejuHeader />
        
        <main className="flex-grow flex items-center justify-center p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">오류가 발생했습니다</h1>
            <p className="text-gray-700">데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
          </div>
        </main>
        
        <AllJejuFooter />
      </div>
    );
  }
}
