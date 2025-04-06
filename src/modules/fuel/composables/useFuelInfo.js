import { ref, computed, watch } from 'vue'; // computed, watch 추가
import { getDirections } from '@/api/kakaoMobility';
import { fetchFuelInfo, fetchFuelPrices } from '@/api/fuelApi'; // Import from fuelApi
import { getCachedData, cacheData } from '@/utils/cacheUtils'; // Import from cacheUtils
const CACHE_KEY = 'fuelInfoData';
const CACHE_DURATION = 60 * 60 * 1000; // 캐시 유효 기간: 1시간 (기본 정보)
const PRICE_CACHE_KEY = 'fuelPriceData';
const PRICE_CACHE_DURATION = 30 * 60 * 1000; // 가격 캐시 유효 기간: 30분

// 기존 getCachedFuelInfo, cacheFuelInfo 함수 제거 (cacheUtils 사용)

// 기존 parseAndTransformFuelData, fetchFuelInfo 함수 제거 (fuelApi 사용)

const loadFuelInfo = async () => {
  const cachedData = getCachedData(CACHE_KEY, CACHE_DURATION); // Use imported cache function
  if (cachedData) {
    return cachedData;
  } else {
    try {
      const fetchedData = await fetchFuelInfo(); // Use imported API function
      if (fetchedData && fetchedData.length > 0) {
        cacheData(CACHE_KEY, fetchedData); // Use imported cache function
      }
      return fetchedData || []; // API 실패 시 빈 배열 반환 보장
    } catch (error) {
      console.error("Error in loadFuelInfo:", error);
      return []; // 에러 발생 시 빈 배열 반환
    }
  }
};

// 기존 fetchFuelPrices 함수 제거 (fuelApi 사용)

// 기존 getCachedFuelPrices, cacheFuelPrices 함수 제거 (cacheUtils 사용)

// 유가 정보 로드 함수 (캐시 우선)
const loadFuelPrices = async () => {
  const cachedPrices = getCachedData(PRICE_CACHE_KEY, PRICE_CACHE_DURATION);
  if (cachedPrices) {
    return cachedPrices;
  } else {
    try {
      const fetchedPrices = await fetchFuelPrices(); // Use imported API function
      if (fetchedPrices && Object.keys(fetchedPrices).length > 0) {
        cacheData(PRICE_CACHE_KEY, fetchedPrices); // Use imported cache function
      }
      return fetchedPrices || {}; // API 실패 시 빈 객체 반환 보장
    } catch (error) {
      console.error("Error in loadFuelPrices:", error);
      return {}; // 에러 발생 시 빈 객체 반환
    }
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