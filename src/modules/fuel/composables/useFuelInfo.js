import { ref, computed, watch } from 'vue'; // computed, watch 추가
import { convertKatecToWgs84 } from '@/utils/coordinateConverter';
import { getDirections } from '@/api/kakaoMobility';
// calculateHaversineDistance import 제거 (여기서는 불필요)
const CACHE_KEY = 'fuelInfoData';
const CACHE_DURATION = 60 * 60 * 1000; // 캐시 유효 기간: 1시간 (기본 정보)
const PRICE_CACHE_KEY = 'fuelPriceData';
const PRICE_CACHE_DURATION = 30 * 60 * 1000; // 가격 캐시 유효 기간: 30분

// localStorage에서 캐시된 데이터 가져오기 (구조화된 데이터 반환하도록 수정)
const getCachedFuelInfo = () => {
  const cachedString = localStorage.getItem(CACHE_KEY);
  if (!cachedString) {
    console.log("Cache is empty.");
    return null;
  }

  try {
    const parsedCache = JSON.parse(cachedString);
    console.log("Parsed cache object:", parsedCache);
    const { timestamp, data } = parsedCache;

    // 캐시 유효 기간 확인
    if (Date.now() - timestamp < CACHE_DURATION) {
      console.log("Cache is valid. Using cached structured data.");
      // 캐시된 데이터는 이미 구조화된 형태라고 가정
      return data;
    } else {
      console.log("Cached data expired.");
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  } catch (error) {
    console.error("Failed to parse cached fuel info:", error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

// localStorage에 구조화된 데이터 저장
const cacheFuelInfo = (structuredData) => {
  try {
    const cacheEntry = {
      timestamp: Date.now(),
      data: structuredData // 구조화된 데이터 저장
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
    console.log("Structured fuel info cached successfully.");
  } catch (error) {
    console.error("Failed to cache structured fuel info:", error);
  }
};

// JSON 데이터를 파싱하고 좌표 변환하여 구조화된 배열로 반환
const parseAndTransformFuelData = (jsonString) => {
  if (!jsonString) {
    // console.warn("parseAndTransformFuelData received empty or invalid input."); // 필요시 주석 해제
    return [];
  }

  try {
    const jsonData = JSON.parse(jsonString);
    // console.log("JSON.parse() successful."); // 필요시 주석 해제

    // API 응답 구조 확인 (result, info_cnt, info 배열)
    if (jsonData.result !== 'success' || !Array.isArray(jsonData.info)) {
      console.error("Invalid JSON data structure received from API:", jsonData);
      return [];
    }

    const gasInfoItems = jsonData.info;
    const structuredData = [];

    // console.log(`Attempting to process ${gasInfoItems.length} gasInfo items from JSON.`); // 필요시 주석 해제

    for (let i = 0; i < gasInfoItems.length; i++) {
      const item = gasInfoItems[i];
      const osnmValue = item.osnm || 'Unknown'; // 상호 (로그용)
      // console.log(`Processing item ${i + 1}: ${osnmValue}`);

      const katecXStr = item.gisxcoor;
      const katecYStr = item.gisycoor;
      // console.log(` - KATEC Coords (string): x=${katecXStr}, y=${katecYStr}`);

      const katecX = parseFloat(katecXStr);
      const katecY = parseFloat(katecYStr);
      // console.log(` - KATEC Coords (float): x=${katecX}, y=${katecY}`);

      if (isNaN(katecX) || isNaN(katecY)) {
        // console.warn(` - Skipping item ${osnmValue} due to invalid KATEC coordinates.`); // 필요시 주석 해제
        continue; // 다음 아이템으로 넘어감
      }

      // 좌표 변환
      // console.log(` - Converting KATEC to WGS84...`);
      const wgs84Coords = convertKatecToWgs84(katecX, katecY);
      // console.log(` - WGS84 Coords result:`, wgs84Coords);

      if (wgs84Coords) {
        structuredData.push({
          // JSON 데이터에서 직접 속성 접근
          id: item.id, // ID 추가 (필요시)
          poll: item.poll,
          gpoll: item.gpoll,
          osnm: item.osnm,
          zip: item.zip,
          adr: item.adr,
          tel: item.tel,
          lpgyn: item.lpgyn,
          gisxcoor: katecX, // 원본 카텍 좌표도 유지
          gisycoor: katecY,
          lat: wgs84Coords.lat, // 변환된 위도
          lng: wgs84Coords.lng, // 변환된 경도
          // 추가된 가격 정보 (필요시 사용)
          gasoline: item.gasoline,
          premium_gasoline: item.premium_gasoline,
          diesel: item.diesel,
          lpg: item.lpg,
        });
      } else {
        // console.warn(` - Skipping item ${osnmValue} due to coordinate conversion error or invalid result.`); // 필요시 주석 해제
      }
    }
    // console.log("Finished processing. Parsed and transformed data count:", structuredData.length); // 필요시 주석 해제
    return structuredData;
  } catch (error) {
    console.error("Failed to parse JSON or transform data:", error); // 에러 로그는 유지
    // console.log("Original string that failed parsing:", jsonString); // 필요시 주석 해제
    return [];
  }
};


// 제주 주유소 정보 API 호출 함수 (구조화된 데이터 반환하도록 수정)
const fetchFuelInfo = async () => {
  const apiUrl = '/api/its/api/infoGasInfoList?code=860665'; // 이 URL이 JSON을 반환한다고 가정
  // console.log(`Fetching fuel info (expecting JSON) via proxy: ${apiUrl}`); // 필요시 주석 해제
  try {
    // console.log("Inside fetchFuelInfo try block. Calling fetch..."); // 필요시 주석 해제
    // fetch 요청 시 mode: 'cors' (기본값) 사용
    const response = await fetch(apiUrl);
    // console.log("Fetch call completed. Response status:", response.status, response.statusText); // 필요시 주석 해제

    if (!response.ok) {
      // console.error(`HTTP error! Status: ${response.status}`); // 에러 로그는 유지 (throw에서 처리)
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // console.log("Response is OK (status 2xx). Proceeding to get text..."); // 필요시 주석 해제
    const jsonText = await response.text();
    // console.log("Raw API Response Text received in fetchFuelInfo:", jsonText); // 필요시 주석 해제

    // JSON 파싱 및 좌표 변환 호출 전 로그
    // console.log("Calling parseAndTransformFuelData with the received text..."); // 필요시 주석 해제
    const structuredData = parseAndTransformFuelData(jsonText);
    // console.log("St ", structuredData) // 사용자 추가 로그 제거

    // 구조화된 데이터를 캐시에 저장
    if (structuredData.length > 0) {
      cacheFuelInfo(structuredData);
    }

    return structuredData; // 구조화된 데이터 반환

  } catch (error) {
    console.error("Failed to fetch or process fuel info:", error);
    return []; // 오류 발생 시 빈 배열 반환
  }
};

// 주유소 정보 로드 (캐시 우선, 구조화된 데이터 반환)
const loadFuelInfo = async () => {
  // console.log("Step 1: Loading Fuel Info..."); // 필요시 주석 해제
  const cachedData = getCachedFuelInfo();
  // console.log("Result of getCachedFuelInfo:", cachedData); // 필요시 주석 해제
  if (cachedData) {
    // console.log("Cache hit. Returning cached data."); // 필요시 주석 해제
    // console.log("Type of cached data being returned:", typeof cachedData, Array.isArray(cachedData) ? "(Array)" : ""); // 필요시 주석 해제
    return cachedData;
  } else {
    // console.log("Cache miss or expired. Fetching from API..."); // 필요시 주석 해제
    const fetchedData = await fetchFuelInfo(); // API 호출 (구조화된 데이터 반환)
    if (fetchedData.length > 0) {
      // console.log("Structured fuel info fetched from API."); // 필요시 주석 해제
    } else {
      // console.log("No fuel info fetched from API or parsing failed."); // 필요시 주석 해제
    }
    // console.log("Returning fetched data from API."); // 필요시 주석 해제
    console.log("Type of fetched data being returned:", typeof fetchedData, Array.isArray(fetchedData) ? "(Array)" : ""); // 반환 타입 로깅
    return fetchedData;
  }
};

// 유가 정보 API 호출 함수
const fetchFuelPrices = async () => {
  const apiUrl = '/api/its/api/infoGasPriceList?code=860665'; // 유가 정보 API URL
  console.log(`Fetching fuel prices (expecting JSON) via proxy: ${apiUrl}`);
  try {
    const response = await fetch(apiUrl);
    console.log("Price fetch call completed. Response status:", response.status, response.statusText);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonText = await response.text();
    console.log("Raw Price API Response Text received:", jsonText);
    const jsonData = JSON.parse(jsonText);

    if (jsonData.result !== 'success' || !Array.isArray(jsonData.info)) {
      console.error("Invalid JSON data structure received from Price API:", jsonData);
      return {}; // 빈 객체 반환
    }

    // 주유소 ID를 키로 하는 가격 정보 객체 생성
    const priceMap = {};
    jsonData.info.forEach(item => {
      priceMap[item.id] = {
        gasoline: item.gasoline,
        premium_gasoline: item.premium_gasoline,
        diesel: item.diesel,
        lpg: item.lpg,
      };
    });
    console.log("Fuel prices fetched and mapped by ID.");
    return priceMap;

  } catch (error) {
    console.error("Failed to fetch or process fuel prices:", error);
    return {}; // 오류 발생 시 빈 객체 반환
  }
};

// 유가 정보 캐싱 관련 함수 (기존 로직 활용 또는 별도 구현)
const getCachedFuelPrices = () => {
  const cachedString = localStorage.getItem(PRICE_CACHE_KEY);
  if (!cachedString) return null;
  try {
    const parsedCache = JSON.parse(cachedString);
    if (Date.now() - parsedCache.timestamp < PRICE_CACHE_DURATION) {
      console.log("Fuel prices loaded from cache.");
      return parsedCache.data;
    } else {
      localStorage.removeItem(PRICE_CACHE_KEY);
      return null;
    }
  } catch (error) {
    localStorage.removeItem(PRICE_CACHE_KEY);
    return null;
  }
};

const cacheFuelPrices = (priceMap) => {
  try {
    const cacheEntry = { timestamp: Date.now(), data: priceMap };
    localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(cacheEntry));
    console.log("Fuel prices cached successfully.");
  } catch (error) {
    console.error("Failed to cache fuel prices:", error);
  }
};

// 유가 정보 로드 함수 (캐시 우선)
const loadFuelPrices = async () => {
  const cachedPrices = getCachedFuelPrices();
  if (cachedPrices) {
    return cachedPrices;
  } else {
    const fetchedPrices = await fetchFuelPrices();
    if (Object.keys(fetchedPrices).length > 0) {
      cacheFuelPrices(fetchedPrices);
    }
    return fetchedPrices;
  }
};


export function useFuelInfo() {
  const fuelInfo = ref([]); // 주유소 기본 정보
  const fuelPrices = ref({}); // 주유소 가격 정보 (ID 기준)
  const isLoadingInfo = ref(false); // 기본 정보 로딩 상태
  const isLoadingPrices = ref(false); // 가격 정보 로딩 상태
  const isCalculatingDistances = ref(false); // 거리 계산 로딩 상태 복원
  // currentUserLocation ref 제거
  const error = ref(null); // 통합 에러 상태
  // 주유소 정보 로드 함수 (기본 정보 + 가격 정보)
  const getFuelData = async () => {
    isLoadingInfo.value = true;
    isLoadingPrices.value = true;
    error.value = null;
    try {
      // 기본 정보와 가격 정보를 병렬로 로드
      const [infoData, priceData] = await Promise.all([
        loadFuelInfo(),
        loadFuelPrices()
      ]);

      console.log("Data received from loadFuelInfo:", infoData);
      // 초기 distance 상태 설정 (undefined)
      fuelInfo.value = infoData.map(station => ({ ...station, distance: undefined }));

      console.log("Data received from loadFuelPrices:", priceData);
      fuelPrices.value = priceData;

    } catch (err) {
      console.error("Error during data loading:", err);
      error.value = '주유소 정보를 불러오는 중 오류가 발생했습니다.';
      fuelInfo.value = [];
      fuelPrices.value = {};
    } finally {
      isLoadingInfo.value = false;
      isLoadingPrices.value = false;
    }
  };

  // 거리 계산 함수 수정 (최저가 주유소 목록과 현재 위치를 인자로 받음)
  const calculateDistances = async (stationsToCalculate, currentLocation) => {
    if (!currentLocation || !Array.isArray(stationsToCalculate) || stationsToCalculate.length === 0) {
      console.log("Cannot calculate distances: Missing current location or stations to calculate.");
      // 이미 distance가 undefined인 상태이므로 별도 초기화 불필요
      return;
    }

    isCalculatingDistances.value = true;
    console.log(`Starting distance calculation for ${stationsToCalculate.length} stations from:`, currentLocation);
    error.value = null; // 거리 계산 에러 초기화

    try {
      const origin = { latitude: currentLocation.lat, longitude: currentLocation.lng };

      // API 호출 프로미스 생성
      const distancePromises = stationsToCalculate.map(station => {
        const destination = { latitude: station.lat, longitude: station.lng };
        return getDirections(origin, destination)
          .then(roadDistance => ({ id: station.id, distance: roadDistance })) // ID와 거리만 반환
          .catch(err => {
            console.error(`Failed to get directions for station ${station.id}:`, err);
            return { id: station.id, distance: null }; // API 실패 시 null
          });
      });

      const distanceResults = await Promise.all(distancePromises);
      console.log("Distance calculation API results:", distanceResults); // API 결과 로그 추가

      // 결과를 fuelInfo ref에 업데이트
      const updatedFuelInfo = fuelInfo.value.map(station => {
        const result = distanceResults.find(r => r.id === station.id);
        if (result) {
          // distance 속성이 변경되었으므로 새 객체 반환 (반응성 유지)
          return { ...station, distance: result.distance };
        }
        return station; // 변경 없는 경우 기존 객체 반환
      });
      // 업데이트될 데이터 로그 추가 (거리 계산 대상만 필터링)
      console.log("Updated fuelInfo data with distances (before assigning):", JSON.parse(JSON.stringify(updatedFuelInfo.filter(s => stationsToCalculate.some(stc => stc.id === s.id)))));

      fuelInfo.value = updatedFuelInfo; // 반응형 업데이트
      console.log("Assigned updated fuelInfo to ref."); // 할당 완료 로그
      console.log("Distance calculation complete for specified stations.");

    } catch (err) {
      console.error("Error calculating distances:", err);
      error.value = '주유소까지의 거리를 계산하는 중 오류가 발생했습니다.';
      // 에러 발생 시 계산 대상 주유소의 거리를 null로 설정 (선택적)
      const errorUpdatedFuelInfo = fuelInfo.value.map(station => {
          if (stationsToCalculate.some(s => s.id === station.id)) {
              return { ...station, distance: null };
          }
          return station;
      });
      fuelInfo.value = errorUpdatedFuelInfo;
    } finally {
      isCalculatingDistances.value = false;
    }
  };

  // isLoading computed property 추가 (둘 중 하나라도 로딩 중이면 true)
  const isLoading = computed(() => isLoadingInfo.value || isLoadingPrices.value || isCalculatingDistances.value);

  return {
    fuelInfo,
    fuelPrices,
    isLoading,
    isLoadingInfo,
    isLoadingPrices,
    isCalculatingDistances, // 거리 계산 로딩 상태 반환
    error,
    getFuelData,
    calculateDistances, // 수정된 거리 계산 함수 반환
  };
}