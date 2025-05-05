import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

// API 기본 URL 및 식별자 (lib에서 가져옴)
const API_BASE_URL = 'https://www.jeju.go.kr/rest/JejuExhibitionService/getJejucultureExhibitionList'; // 제주문화예술진흥원 공연전시 정보 API URL
const API_IDENTIFIER = 'jejuExhibition'; // ApiSyncStatus에서 사용할 고유 식별자

// API 아이템 타입 정의 (lib에서 가져옴)
interface ApiItem {
  seq: string;
  title?: string;
  category?: string;
  categoryName?: string;
  cover?: string;
  coverThumb?: string;
  startDate?: string;
  endDate?: string;
  hour?: string;
  pay?: string;
  locs?: string;
  locNames?: string;
  owner?: string;
  tel?: string;
  stat?: string;
  divName?: string;
  intro?: string;
}

// Helper to parse date string (lib에서 가져옴, null 처리 개선)
const parseDate = (dateString: string | undefined): Date | null => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date; // 유효하지 않은 날짜면 null 반환
  } catch {
    return null;
  }
};

// POST /api/external-exhibitions (Sync external exhibitions)
export async function POST(request: NextRequest) {
  console.log('Starting External Exhibition sync via POST...');
  let page = 1;
  let totalProcessedCount = 0;
  let moreData = true;
  let lastError = null;
  let lastSuccessfulPage = 0; // 마지막 성공 페이지 기록

  // ApiSyncStatus에서 마지막 페이지 가져오기
  try {
    const syncStatus = await prisma.apiSyncStatus.findUnique({
      where: { apiIdentifier: API_IDENTIFIER },
    });
    if (syncStatus) {
      const lastPage = syncStatus.lastPageFetched; // 변수에 먼저 할당
      if (syncStatus.lastPageFetched !== null && syncStatus.lastPageFetched > 0) {
        const lastPage = syncStatus.lastPageFetched;
        // 이전 성공 페이지 다음부터 시작 (선택적: 처음부터 다시 하려면 이 로직 제거)
        // page = lastPage + 1;
        console.log(`Found previous sync status. Last fetched page: ${lastPage}`);
        // 만약 동기화를 이어서 하려면:
        // page = lastPage + 1;
        // console.log(`Resuming sync from page ${page}`);
      }
    }
  } catch (e) {
    console.error('Failed to get last sync status:', e);
    // 상태 읽기 실패 시 처음부터 시작
  }

  while (moreData) {
    const apiUrl = `${API_BASE_URL}?page=${page}&pageSize=1000`;
    console.log(`[ExternalExhibitions POST] Fetching data from: ${apiUrl}`); // 요청 URL 로그
    try {
      const response = await axios.get(apiUrl, { timeout: 10000 });
      console.log(`[ExternalExhibitions POST] Raw API Response Status: ${response.status}`); // 응답 데이터 로그
      // 필요시 전체 데이터 로깅: console.log('[ExternalExhibitions POST] Raw API Response Data:', JSON.stringify(response.data, null, 2));

      let items: ApiItem[] | undefined;

      // 데이터 파싱 (JSON 우선 처리)
      if (typeof response.data === 'object' && response.data !== null) {
        // JSON 응답 처리
        console.log('[ExternalExhibitions POST] Received JSON response. Processing...');
        // 다양한 가능한 경로에서 아이템 배열 시도
        let potentialItems = 
          response.data?.items?.item || // { items: { item: [...] } }
          response.data?.items ||       // { items: [...] }
          response.data?.data?.items || // { data: { items: [...] } }
          response.data?.data ||        // { data: [...] }
          response.data?.list ||        // { list: [...] }
          response.data?.bbsList;       // 이전 시도 경로

        if (potentialItems && !Array.isArray(potentialItems) && typeof potentialItems === 'object' && potentialItems.item) {
           // 예: { items: { item: [...] } } 구조에서 item 배열 추출
            potentialItems = potentialItems.item;
        }
        
        items = potentialItems && Array.isArray(potentialItems) ? potentialItems : [];
        console.log(`[ExternalExhibitions POST] Parsed ${items.length} items from JSON.`);

      } else if (typeof response.data === 'string') {
        // 문자열 응답 - XML 가능성 확인 (만약을 위한 처리)
        const trimmed = response.data.trim();
        if (trimmed.startsWith('<')) {
          console.warn('[ExternalExhibitions POST] Received string response, attempting XML parse as fallback...');
          try {
            const parsedXml = await parseStringPromise(trimmed, { explicitArray: false });
            // 이전 XML 경로 시도
            const potentialItems = parsedXml?.jejunetApi?.items?.item;
            items = potentialItems ? (Array.isArray(potentialItems) ? potentialItems : [potentialItems]) : [];
            console.log(`[ExternalExhibitions POST] Parsed ${items.length} items from XML fallback.`);
          } catch (parseError) {
            console.error('[ExternalExhibitions POST] XML fallback parsing failed:', parseError);
            items = [];
            lastError = `XML Fallback Parsing Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`;
          }
        } else {
          console.warn('[ExternalExhibitions POST] Received non-XML string response:', trimmed);
          items = [];
        }
      } else {
        // 알 수 없는 형식의 응답
        console.warn('[ExternalExhibitions POST] Received unknown response type:', typeof response.data);
        items = [];
      }

      if (items && Array.isArray(items) && items.length > 0) {
        console.log(`[ExternalExhibitions POST] Processing ${items.length} items from page ${page}...`); // 처리 시작 로그

        for (const item of items) {
          try {
            await prisma.externalExhibition.upsert({
              where: { seq: parseInt(item.seq, 10) }, // seq를 숫자로 변환
              update: {
                title: item.title || '', // null 대신 빈 문자열
                category: item.category,
                categoryName: item.categoryName,
                cover: item.cover,
                coverThumb: item.coverThumb,
                startDate: parseDate(item.startDate),
                endDate: parseDate(item.endDate),
                hour: item.hour,
                pay: item.pay,
                locs: item.locs,
                locNames: item.locNames,
                owner: item.owner,
                tel: item.tel,
                stat: item.stat,
                divName: item.divName,
                intro: item.intro,
                // approved는 업데이트 시 변경하지 않음 (관리자가 설정)
                updatedAt: new Date(),
              },
              create: {
                seq: parseInt(item.seq, 10), // seq를 숫자로 변환
                title: item.title || '',
                category: item.category,
                categoryName: item.categoryName,
                cover: item.cover,
                coverThumb: item.coverThumb,
                startDate: parseDate(item.startDate),
                endDate: parseDate(item.endDate),
                hour: item.hour,
                pay: item.pay,
                locs: item.locs,
                locNames: item.locNames,
                owner: item.owner,
                tel: item.tel,
                stat: item.stat,
                divName: item.divName,
                intro: item.intro,
                approved: false, // 새로 생성 시 기본값
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
            totalProcessedCount++;
          } catch (upsertError) {
            console.error(`Failed to upsert item (seq: ${item.seq}) from page ${page}:`, upsertError);
            lastError = upsertError instanceof Error ? upsertError.message : String(upsertError);
            // 개별 아이템 실패 시 계속 진행할지 결정 (여기서는 계속 진행)
          }
        }

        page++; // 다음 페이지로 이동
        lastSuccessfulPage = page - 1; // 현재 페이지 성공 기록
      } else {
        console.log(`[ExternalExhibitions POST] No items found or bbsList is empty/invalid on page ${page}. Stopping.`); // 데이터 없는 경우 로그
        moreData = false; // 데이터 없으면 루프 중단
      }
    } catch (fetchError: any) {
      // 에러 상세 로깅
      console.error(`[ExternalExhibitions POST] Failed to fetch or process data from ${apiUrl}. Error:`, fetchError.message);
      if (fetchError.response) {
        // 요청은 이루어졌으나 서버가 오류 상태 코드로 응답
        console.error(`[ExternalExhibitions POST] Error Response Status: ${fetchError.response.status}`);
        console.error('[ExternalExhibitions POST] Error Response Data:', fetchError.response.data);
      } else if (fetchError.request) {
        // 요청은 이루어졌으나 응답을 받지 못함
        console.error('[ExternalExhibitions POST] No response received:', fetchError.request);
      } else {
        // 요청 설정 중 오류 발생
        console.error('[ExternalExhibitions POST] Error setting up request:', fetchError.message);
      }
      lastError = fetchError instanceof Error ? fetchError.message : String(fetchError);
      moreData = false; // 네트워크 오류 등 발생 시 중단
      // 오류 발생 시, 마지막 성공 페이지는 변경하지 않음 (lastSuccessfulPage는 이전 루프에서 업데이트됨)
    }
  }

  // 최종 동기화 상태 업데이트
  try {
    await prisma.apiSyncStatus.upsert({
      where: { apiIdentifier: API_IDENTIFIER },
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
    console.log(`Sync status updated. Last successful page fetched: ${lastSuccessfulPage}`);
  } catch (statusError) {
    console.error('Failed to update sync status:', statusError);
    if (!lastError) {
        lastError = statusError instanceof Error ? statusError.message : String(statusError);
    }
  }

  console.log(`External Exhibition sync finished via POST. Total processed items: ${totalProcessedCount}, Last successful page attempted: ${lastSuccessfulPage}.`);

  if (lastError) {
    return NextResponse.json({ success: false, message: 'Sync completed with errors.', error: lastError, totalProcessedCount, lastPageFetched: lastSuccessfulPage }, { status: 500 });
  } else {
    return NextResponse.json({ success: true, message: 'Sync completed successfully.', totalProcessedCount, lastPageFetched: lastSuccessfulPage });
  }
}

// GET /api/external-exhibitions (List exhibitions)
export async function GET(request: NextRequest) {
  // public listing with optional approval filter
  const { searchParams } = request.nextUrl;
  const approvedParam = searchParams.get('approved');
  const where = approvedParam !== null ? { approved: approvedParam === 'true' } : {};
  const data = await prisma.externalExhibition.findMany({ where, orderBy: { seq: 'asc' } });
  return NextResponse.json({ success: true, data });
}

// PATCH /api/external-exhibitions (Update approval status)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, approved } = body; // ExternalExhibition uses 'id'

    if (typeof id !== 'number' || isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }
    if (typeof approved !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid approved status' }, { status: 400 });
    }

    // Check if the record exists before updating
    const existingExhibition = await prisma.externalExhibition.findUnique({
      where: { id },
    });

    if (!existingExhibition) {
      return NextResponse.json({ success: false, error: 'External exhibition not found' }, { status: 404 });
    }

    const updatedExhibition = await prisma.externalExhibition.update({
      where: { id },
      data: { approved },
    });

    return NextResponse.json({ success: true, data: updatedExhibition });
  } catch (error) {
    console.error('Failed to update external exhibition approval:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
