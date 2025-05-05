// src/app/api/jejunolda-events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

// Jejunolda API 기본 URL 및 식별자
const API_BASE_URL = 'https://www.jejunolda.com/api/event/';
const API_IDENTIFIER = 'jejunoldaEvent'; // ApiSyncStatus에서 사용할 고유 식별자

// Jejunolda API 아이템 타입 정의 (제공된 응답 기반)
interface ApiItemJejunolda {
  seq: number;
  name?: string;
  start?: number; // Unix timestamp (ms)
  end?: number;   // Unix timestamp (ms)
  time?: string;
  categoryName?: string;
  payName?: string;
  locName?: string;
  intro?: string;
  cover?: string;
  coverThumb?: string;
  host?: string;
  instituteName?: string;
  tel?: string;
  addr1?: string;
  addr2?: string;
  // 필요한 다른 필드 추가 가능...
}

// Helper to parse Unix timestamp (ms) to Date
const parseDate = (timestamp: number | undefined): Date | null => {
  if (timestamp === undefined || timestamp === null) return null;
  try {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

// POST /api/jejunolda-events (Sync Jejunolda events)
export async function POST(request: NextRequest) {
  console.log('Starting Jejunolda Event sync via POST...');
  let page = 1;
  const pageSize = 1000; // API에서 지원하는 최대 페이지 크기 또는 적절한 값
  let totalProcessedCount = 0;
  let moreData = true;
  let lastError = null;
  let lastSuccessfulPage = 0;

  // ApiSyncStatus에서 마지막 페이지 가져오기 (페이지네이션 사용 시)
  try {
    const syncStatus = await prisma.apiSyncStatus.findUnique({
      where: { apiIdentifier: API_IDENTIFIER },
    });
    if (syncStatus) {
      if (syncStatus.lastPageFetched !== null && syncStatus.lastPageFetched > 0) {
        lastSuccessfulPage = syncStatus.lastPageFetched;
        // page = lastSuccessfulPage + 1; // 이어서 시작 (필요 시 주석 해제)
        console.log(`Found previous sync status. Last fetched page: ${lastSuccessfulPage}. Resuming from page ${page}`);
      }
    }
  } catch (e) {
    console.error('Failed to get last sync status:', e);
  }

  while (moreData) {
    const apiUrl = `${API_BASE_URL}?page=${page}&pageSize=${pageSize}`;
    console.log(`Fetching page ${page} (pageSize=${pageSize}) from ${apiUrl}`);

    try {
      const response = await axios.get(apiUrl, { timeout: 15000 });
      const rawData = response.data;

      // 데이터 구조 확인 및 items 추출 (JSON 응답 기반)
      const items: ApiItemJejunolda[] = rawData?.items || [];

      if (items.length === 0) {
        console.log(`No more items found on page ${page}. Sync finished.`);
        moreData = false;
        // 마지막으로 성공한 페이지는 이전 페이지
        // API가 빈 배열을 반환했을 때, 이전 페이지까지는 성공한 것이므로 page - 1
        lastSuccessfulPage = page - 1 > 0 ? page - 1 : 0; 
        break;
      }

      console.log(`Processing ${items.length} items from page ${page}...`);
      let pageSuccess = true;

      for (const item of items) {
        if (item.seq === undefined || item.seq === null) {
            console.warn('Skipping item without seq:', item);
            continue; // seq 없으면 건너뛰기
        }

        try {
          await prisma.externalEventJejunolda.upsert({
            where: { apiSeq: item.seq }, // 고유 ID 필드
            update: { // 업데이트할 필드들
              title: item.name,
              startDate: parseDate(item.start),
              endDate: parseDate(item.end),
              time: item.time,
              categoryName: item.categoryName,
              payName: item.payName,
              locName: item.locName,
              intro: item.intro,
              cover: item.cover,
              coverThumb: item.coverThumb,
              host: item.host,
              instituteName: item.instituteName,
              tel: item.tel,
              addr1: item.addr1,
              addr2: item.addr2,
              updatedAt: new Date(),
            },
            create: { // 새로 생성할 때의 필드들
              apiSeq: item.seq,
              title: item.name,
              startDate: parseDate(item.start),
              endDate: parseDate(item.end),
              time: item.time,
              categoryName: item.categoryName,
              payName: item.payName,
              locName: item.locName,
              intro: item.intro,
              cover: item.cover,
              coverThumb: item.coverThumb,
              host: item.host,
              instituteName: item.instituteName,
              tel: item.tel,
              addr1: item.addr1,
              addr2: item.addr2,
              approved: false, // 기본값
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          totalProcessedCount++;
        } catch (upsertError) {
          console.error(`Failed to upsert item (apiSeq: ${item.seq}) from page ${page}:`, upsertError);
          lastError = upsertError instanceof Error ? upsertError.message : String(upsertError);
          pageSuccess = false;
        }
      }

      if (pageSuccess) {
        lastSuccessfulPage = page; // 현재 페이지 전체 성공 시 업데이트
      } else {
         // 페이지 처리 중 일부라도 실패하면, 마지막 성공 페이지는 이전 페이지
         lastSuccessfulPage = page - 1 > 0 ? page - 1 : 0; 
      }

      page++; // 다음 페이지로

    } catch (fetchError) {
      console.error(`Failed to fetch or process page ${page}:`, fetchError);
      lastError = fetchError instanceof Error ? fetchError.message : String(fetchError);
      moreData = false;
      lastSuccessfulPage = page - 1 > 0 ? page - 1 : 0; // 오류 직전 페이지까지 성공
    }
  }

  // 최종 동기화 상태 업데이트
  try {
    await prisma.apiSyncStatus.upsert({
      where: { apiIdentifier: API_IDENTIFIER }, // 고유 식별자 사용
      update: {
        lastPageFetched: lastSuccessfulPage,
        lastSyncTime: new Date(),
      },
      create: {
        apiIdentifier: API_IDENTIFIER,
        lastPageFetched: lastSuccessfulPage,
        lastSyncTime: new Date(),
      },
    });
    console.log(`Sync status updated for ${API_IDENTIFIER}. Last successful page: ${lastSuccessfulPage}`);
  } catch (statusError) {
    console.error(`Failed to update sync status for ${API_IDENTIFIER}:`, statusError);
    if (!lastError) {
        lastError = statusError instanceof Error ? statusError.message : String(statusError);
    }
  }

  console.log(`Jejunolda Event sync finished via POST. Total processed items: ${totalProcessedCount}, Last successful page: ${lastSuccessfulPage}.`);

  if (lastError) {
    return NextResponse.json({ success: false, error: `Sync completed with errors: ${lastError}`, totalProcessedCount, lastSuccessfulPage }, { status: 500 });
  } else {
    return NextResponse.json({ success: true, message: 'Sync completed successfully.', totalProcessedCount, lastSuccessfulPage });
  }
}

// GET /api/jejunolda-events (List Jejunolda events - 필요시 구현)
export async function GET(request: NextRequest) {
    try {
        // 페이지네이션, 필터링 등 추가 가능
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
        const skip = (page - 1) * pageSize;

        const [events, totalCount] = await prisma.$transaction([
            prisma.externalEventJejunolda.findMany({
                skip: skip,
                take: pageSize,
                orderBy: { startDate: 'desc' }, // 예시: 시작일 내림차순
            }),
            prisma.externalEventJejunolda.count(),
        ]);

        const totalPages = Math.ceil(totalCount / pageSize);

        return NextResponse.json({
            success: true,
            data: events,
            pagination: {
                page,
                pageSize,
                totalCount,
                totalPages,
            },
        });
    } catch (error) {
        console.error('Failed to fetch Jejunolda events:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch data.' }, { status: 500 });
    }
}

// PATCH /api/jejunolda-events (Update approval status - 필요시 구현)
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, approved } = body;

        if (typeof id !== 'number' || typeof approved !== 'boolean') {
            return NextResponse.json({ success: false, error: 'Invalid input. Requires id (number) and approved (boolean).' }, { status: 400 });
        }

        const updatedEvent = await prisma.externalEventJejunolda.update({
            where: { id: id }, // Prisma 모델의 기본키 '@id' 사용
            data: { approved: approved },
        });

        return NextResponse.json({ success: true, data: updatedEvent });

    } catch (error: any) {
        console.error('Failed to update Jejunolda event approval status:', error);
        if (error.code === 'P2025') { // Prisma 에러 코드: 레코드 찾을 수 없음
             return NextResponse.json({ success: false, error: 'Event not found.' }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: 'Failed to update status.' }, { status: 500 });
    }
}