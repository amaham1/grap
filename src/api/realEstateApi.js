// 실제 API 통신을 위한 기본 설정
const BASE_URL = 'http://akapwhdgrap.cafe24.com/api';

// API 호출 시 공통으로 사용할 에러 처리 함수
const handleApiError = (error) => {
  console.error('API 호출 중 오류 발생:', error);
  throw error;
};

// 실제 API 호출을 시뮬레이션하는 함수들
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const mockData = [
  {
    jsApRSId: 37723,
    buildYear: 2009,
    dealDay: 16,
    floor: 16,
    dealYear: 2025,
    dealMonth: 1,
    dealAmount: 38000,
    aptNm: "일호지오빌",
    aptSeq: "50110-3044",
    umdNm: "노형동",
    excluUseAr: 78.3,
    longitude: 126.26505,
    latitude: 33.412353
  },
  {
    jsApRSId: 37724,
    buildYear: 2012,
    dealDay: 15,
    floor: 4,
    dealYear: 2025,
    dealMonth: 1,
    dealAmount: 8000,
    aptNm: "재영샤르빌",
    aptSeq: "50110-3225",
    umdNm: "노형동",
    excluUseAr: 33.7216,
    longitude: 126.482,
    latitude: 33.4865
  },
  {
    jsApRSId: 37725,
    buildYear: 2012,
    dealDay: 15,
    floor: 4,
    dealYear: 2022,
    dealMonth: 1,
    dealAmount: 8000,
    aptNm: "샤르빌",
    aptSeq: "50110-1234",
    umdNm: "월산동",
    excluUseAr: 33.7216,
    longitude: 126.482,
    latitude: 33.4865
  }
];

// 시세 데이터 목업
const mockPriceData = [
  { date: '2024-01', avgPrice: 35000 },
  { date: '2024-02', avgPrice: 36000 },
  { date: '2024-03', avgPrice: 35500 },
  { date: '2024-04', avgPrice: 37000 },
  { date: '2024-05', avgPrice: 38000 },
  { date: '2024-06', avgPrice: 37500 },
  { date: '2024-07', avgPrice: 38500 },
  { date: '2024-08', avgPrice: 39000 },
  { date: '2024-09', avgPrice: 38000 },
  { date: '2024-10', avgPrice: 39500 },
  { date: '2024-11', avgPrice: 40000 },
  { date: '2024-12', avgPrice: 41000 },
  { date: '2025-01', avgPrice: 42000 }
];

// 고유한 지역 목록 추출
export const getLocations = () => {
  const locations = [...new Set(mockData.map(estate => estate.umdNm))];
  return locations.sort();
};

// 고유한 거래일자 목록 추출 (YYYY-MM 형식)
export const getDealDates = () => {
  const dates = [...new Set(mockData.map(estate => 
    `${estate.dealYear}-${estate.dealMonth.toString().padStart(2, '0')}`
  ))];
  return dates.sort().reverse(); // 최신 날짜순으로 정렬
};

// 정렬 함수
const sortData = (data,Type, sortOrder) => {
  if (!Type || !sortOrder) return data;

  return [...data].sort((a, b) => {
    let compareA, compareB;

    if (Type === 'dealAmount') {
      compareA = a.dealAmount;
      compareB = b.dealAmount;
    } else if (Type === 'aptNm') {
      compareA = a.aptNm;
      compareB = b.aptNm;
    }

    if (sortOrder === 'asc') {
      return compareA > compareB ? 1 : -1;
    } else {
      return compareA < compareB ? 1 : -1;
    }
  });
};

export const realEstateApi = {
  // 부동산 매물 목록을 가져오는 API
  async fetchRealEstates({ 
    searchQuery = '', 
    umdNm = null,
    location = '', 
    startDate = '', 
    endDate = '', 
    sortType = '', 
    sortOrder = '',
    itemNum = 0,
    itemSizePerPage = 10,
    searchType = '',
    searchKey = ''
  }) {
    try {
      // 유효한 값만 포함하는 객체 생성
      const validParams = {
        itemNum: itemNum.toString(),
        itemSizePerPage: itemSizePerPage.toString()
      };

      // 선택적 파라미터들은 값이 있을 때만 추가
      if (searchQuery?.trim()) {
        validParams.searchType = 'apt_nm';
        validParams.searchKey = searchQuery.trim();
      }

      if (searchType?.trim()) validParams.searchType = searchType.trim();
      if (searchKey?.trim()) validParams.searchKey = searchKey.trim();
      if (umdNm) validParams.umdNm = umdNm;
      if (location?.trim()) validParams.location = location.trim();
      if (startDate?.trim()) validParams.startDate = startDate.trim();
      if (endDate?.trim()) validParams.endDate = endDate.trim();
      if (sortType?.trim()) validParams.sortType = sortType.trim();
      if (sortOrder?.trim()) validParams.sortOrder = sortOrder.trim();

      const queryParams = new URLSearchParams(validParams);

      console.log('API 요청 파라미터:', Object.fromEntries(queryParams.entries()));

      const response = await fetch(`${BASE_URL}/real-estate/all?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const result = {
        realEstates: [],
        totalCount: 0,
        totalPages: 0
      };

      if (data) {
        if (Array.isArray(data)) {
          result.realEstates = data;
          result.totalCount = data.length;
          result.totalPages = Math.ceil(data.length / itemSizePerPage);
        } else if (data.content) {
          result.realEstates = data.content;
          result.totalCount = data.totalElements;
          result.totalPages = data.totalPages;
        } else {
          result.realEstates = data.realEstates || [];
          result.totalCount = data.totalCount || 0;
          result.totalPages = data.totalPages || Math.ceil(result.totalCount / itemSizePerPage);
        }
      }

      return result;
    } catch (error) {
      console.error('Error fetching real estates:', error);
      throw error;
    }
  },

  // 특정 부동산의 상세 정보를 가져오는 API
  async fetchRealEstateDetail(jsApRSId) {
    try {
      const response = await fetch(`${BASE_URL}/real-estate/detail/${jsApRSId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      handleApiError(error);
    }
  },

  // 이번 달 최고가 거래 TOP 5를 가져오는 API
  async fetchTopDealsByAmount(dealDate) {
    try {
      const url = new URL(`${BASE_URL}/real-estate/top-monthly-real-estate`);
      url.searchParams.append('dealDate', dealDate); // YYYY-MM 형식
      
      const response = await fetch(url);
      console.log('[DEBUG] API Request:', url.toString());
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      console.log('[DEBUG] API Response:', data);
      return data;
    } catch (error) {
      console.error('[ERROR] Failed to fetch top deals:', error);
      throw error;
    }
  },

  // 특정 부동산의 시세 데이터를 가져오는 API
  async fetchPriceHistory({
    jsApRSId,
    aptSeq,
    floor,
    searchWord,
    startDate,
    endDate,
    itemNum = 0,
    itemSizePerPage = 10,
    searchKey,
    searchType,
    sortType,
    sortOrder
  }) {
    try {
      const url = new URL(`${BASE_URL}/real-estate/detail-price-history`);
      const params = new URLSearchParams();

      // 필수가 아닌 파라미터들은 값이 있을 때만 추가
      if (jsApRSId) params.append('jsApRSId', jsApRSId);
      if (aptSeq) params.append('aptSeq', aptSeq);
      if (floor) params.append('floor', floor);
      if (searchWord) params.append('searchWord', searchWord);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (searchKey) params.append('searchKey', searchKey);
      if (searchType) params.append('searchType', searchType);
      if (sortType) params.append('sortType', sortType);
      if (sortOrder) params.append('sortOrder', sortOrder);

      // 기본값이 있는 파라미터들
      params.append('itemNum', itemNum.toString());
      params.append('itemSizePerPage', itemSizePerPage.toString());

      url.search = params.toString();
      console.log('시세 데이터 요청 URL:', url.toString());

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('시세 데이터 조회 오류:', {
          상태: response.status,
          메시지: errorText
        });
        throw new Error(`시세 데이터 조회 오류: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('시세 데이터 응답:', data);

      return data;
    } catch (error) {
      console.error('시세 데이터 조회 실패:', error);
      throw error;
    }
  }
};
