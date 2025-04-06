// src/modules/fuel/composables/useStationFiltering.js
import { ref, computed, watch, nextTick } from 'vue';
import { calculateDistance } from '@/utils/geolocationUtils'; // calculateDistance import 추가

// userLocation 인자 추가
export function useStationFiltering(fuelInfo, fuelPrices, selectedFuelType, selectedCity, mapInstance, userLocation) {
  const stationsInBounds = ref([]); // 지도 범위 내 필터링된 주유소 (마커 표시용)
  // lowestPriceStations를 computed로 변경
  const visibleStations = ref([]); // 실제로 지도에 표시될 주유소 (stationsInBounds 기반)
  const visibleCount = ref(10);
  const INITIAL_VISIBLE_COUNT = 10;
  const LOAD_MORE_COUNT = 10;
  const isSearching = ref(false); // 지도 검색 로딩 상태
  // currentMinPrice도 computed로 변경 예정

  // '더 보기' 버튼 표시 여부 (지도 내 주유소 기준)
  const canLoadMore = computed(() => stationsInBounds.value.length > visibleStations.value.length);

  // --- Helper Functions ---

  // 공통 필터링 로직 함수
  const filterStations = (station) => {
    const prices = fuelPrices.value[station.id];
    // '전체' 조건 제거: selectedCity 값이 '전체'가 아닌 실제 도시 이름일 때만 필터링
    const cityFilter = station.adr && station.adr.includes(selectedCity.value);
    const price = prices ? prices[selectedFuelType.value] : undefined;
    const hasValidPrice = typeof price === 'number' && price > 0;

    // 좌표 정보가 없는 주유소 제외
    if (!station.lat || !station.lng) return false;

    if (selectedFuelType.value === 'lpg') {
      return hasValidPrice && cityFilter && station.lpgyn === 'Y';
    }
    return hasValidPrice && cityFilter;
  };

  // 정렬 함수 (가격 우선, 제주시 우선, 거리 차선)
  const sortStations = (a, b) => {
    const priceA = fuelPrices.value[a.id]?.[selectedFuelType.value] ?? Infinity;
    const priceB = fuelPrices.value[b.id]?.[selectedFuelType.value] ?? Infinity;

    // 1. 가격 비교
    if (priceA !== priceB) {
      return priceA - priceB;
    }

    // 2. 가격이 같으면 제주시 우선 정렬
    const isAJeju = a.adr && a.adr.includes('제주시');
    const isBJeju = b.adr && b.adr.includes('제주시');

    if (isAJeju && !isBJeju) {
      return -1; // a가 제주시, b는 아니면 a 우선
    }
    if (!isAJeju && isBJeju) {
      return 1; // b가 제주시, a는 아니면 b 우선
    }

    // 3. 둘 다 제주시거나 둘 다 아니면 거리로 정렬 (userLocation이 있을 경우)
    if (userLocation.value) {
      const distA = typeof a.distance === 'number' ? a.distance : Infinity;
      const distB = typeof b.distance === 'number' ? b.distance : Infinity;
      // 거리가 유효하지 않은 경우(Infinity)를 뒤로 보내기 위한 처리 추가 가능
      if (distA === Infinity && distB !== Infinity) return 1;
      if (distA !== Infinity && distB === Infinity) return -1;
      return distA - distB;
    }

    return 0; // 사용자 위치 없으면 가격 및 제주시 우선 순서 유지
  };

  // --- Computed Properties ---
  // 최저가 주유소 TOP 10을 가까운 순으로 정렬하여 계산하는 computed 속성
  const lowestPriceStations = computed(() => {
    // 의존성: fuelInfo, fuelPrices, selectedFuelType, selectedCity, userLocation
    if (!Array.isArray(fuelInfo.value) || fuelInfo.value.length === 0 || Object.keys(fuelPrices.value).length === 0) {
      console.warn("[Filtering Computed] Data not ready for lowest price station list.");
      return [];
    }
    // console.log("[Filtering Computed] Calculating lowest price stations, sorted by distance...");

    // 1. 선택된 유종/도시 기준으로 모든 주유소 필터링
    const allFilteredStations = fuelInfo.value.filter(filterStations); // Use helper function

    // 2. 가격순으로 정렬 (1차 기준)
    // 가격순 정렬 (1차) - sortStations 사용 (거리 계산 전)
    allFilteredStations.sort((a, b) => {
        const priceA = fuelPrices.value[a.id]?.[selectedFuelType.value] ?? Infinity;
        const priceB = fuelPrices.value[b.id]?.[selectedFuelType.value] ?? Infinity;
        return priceA - priceB;
    });

    // 3. 상위 10개 추출 (최저가 TOP 10)
    const top10LowestPrice = allFilteredStations.slice(0, 10);

    // 4. 사용자 위치가 있으면 거리 계산 및 추가
    let top10WithDistance = top10LowestPrice;
    if (userLocation.value && userLocation.value.lat && userLocation.value.lng) {
      // console.log("[Filtering Computed] Calculating distances for top 10 lowest price stations.");
      top10WithDistance = top10LowestPrice.map(station => ({
        ...station,
        distance: calculateDistance(
          userLocation.value.lat,
          userLocation.value.lng,
          station.lat,
          station.lng
        )
      }));

      // 5. 최종 정렬 (가격 우선, 거리 차선) - sortStations 사용
      top10WithDistance.sort(sortStations);
    } else {
      // 사용자 위치 없으면 distance 속성 null로 설정 (정렬은 가격순 유지)
      // console.log("[Filtering Computed] User location not available, skipping distance calculation and sorting.");
      top10WithDistance = top10LowestPrice.map(station => ({ ...station, distance: null }));
    }

    // console.log(`[Filtering Computed] Final list contains ${top10WithDistance.length} stations.`);
    return top10WithDistance;
  });

  // 필터링된 전체 주유소 목록 (도시, 유종 기준) - 정렬/슬라이스 없음
  const filteredStations = computed(() => {
    // 의존성: fuelInfo, fuelPrices, selectedFuelType, selectedCity
    if (!Array.isArray(fuelInfo.value) || fuelInfo.value.length === 0 || Object.keys(fuelPrices.value).length === 0) {
      return [];
    }
    // console.log("[Filtering Computed] Calculating all filtered stations (city, fuel type)...");

    return fuelInfo.value.filter(filterStations); // Use helper function
  });

  // currentMinPrice도 computed로 정의
  const currentMinPrice = computed(() => {
    // lowestPriceStations computed가 최신 가격 정보를 반영하므로 여기서 가져옴
    // lowestPriceStations가 비어있으면 filteredStations 기준으로 계산할 수도 있지만,
    // 현재 로직은 lowestPriceStations[0]의 가격을 사용하므로 그대로 둠.
    if (lowestPriceStations.value.length > 0) {
      return fuelPrices.value[lowestPriceStations.value[0].id]?.[selectedFuelType.value] ?? Infinity;
    }
    // 필요하다면 filteredStations를 순회하여 최저가를 찾을 수 있음
    // let minPrice = Infinity;
    // filteredStations.value.forEach(station => {
    //   const price = fuelPrices.value[station.id]?.[selectedFuelType.value];
    //   if (price > 0) minPrice = Math.min(minPrice, price);
    // });
    // return minPrice;
    return Infinity; // 현재 로직 유지
  });

  // 지도 범위 내 마커 업데이트 함수 (최저가 목록 계산 로직 제거)
  const updateMapMarkersInBounds = async (isInitialLoad = false) => {
    if (!mapInstance.value || !Array.isArray(fuelInfo.value) || fuelInfo.value.length === 0 || Object.keys(fuelPrices.value).length === 0) {
      console.warn("[Filtering] Map or data not ready for updating map markers.");
      return;
    }
    if (!isInitialLoad) {
        isSearching.value = true;
    }
    // console.log("[Filtering] Updating map markers based on current bounds and filters...");

    await nextTick();
    let bounds;
    try {
      bounds = mapInstance.value.getBounds();
      if (!bounds) throw new Error("Failed to get map bounds.");
    } catch (e) {
      console.error("[Filtering] Error getting map bounds:", e);
      if (!isInitialLoad) isSearching.value = false;
      return;
    }

    // 최저가 목록 계산 로직 제거 (computed가 처리)

    // 필터링된 전체 주유소 목록 계산 (지도 범위 필터링용)
    // lowestPriceStations computed와 유사하지만 정렬/slice 없음
    // 필터링된 전체 주유소 목록 사용 (filteredStations computed 활용)
    const allFilteredStationsForBounds = filteredStations.value;

    // --- 2. 지도 범위 내 마커 업데이트 로직 (기존 로직 유지) ---
    // console.log("[Filtering] Updating map markers based on current bounds...");

    // allFilteredStationsForBounds에서 지도 범위 내 주유소 찾기
    // 지도 범위 필터링 함수 사용 (아래 정의)
    stationsInBounds.value = filterStationsInBounds(allFilteredStationsForBounds, bounds);
    // console.log(`[Filtering] Found ${stationsInBounds.value.length} stations within map bounds to display.`);
    // --- 지도 범위 내 마커 업데이트 로직 끝 ---

    // 지도에 표시할 마커 업데이트
    visibleCount.value = INITIAL_VISIBLE_COUNT; // 표시 개수 초기화
    updateVisibleStations(); // displayMarkers 호출 트리거 (useMapDisplay에서 감시)

    if (!isInitialLoad) {
        isSearching.value = false;
    }
  };

  // 표시할 주유소 목록 업데이트 (지도 범위 내 주유소 기준)
  const updateVisibleStations = () => {
    // stationsInBounds가 변경되면 visibleStations 업데이트
    visibleStations.value = stationsInBounds.value.slice(0, visibleCount.value);
    // console.log(`[Filtering] Updating visible stations state: ${visibleStations.value.length}`);
    // 실제 마커 표시는 useMapDisplay에서 visibleStations를 watch하여 처리
  };

  // '더 보기' 함수 (지도 내 주유소 기준)
  const loadMore = () => {
    visibleCount.value += LOAD_MORE_COUNT;
    updateVisibleStations(); // visibleStations 업데이트
  };

  // stationsInBounds 변경 시 visibleStations 업데이트 (초기 로드 및 필터링 후)
  watch(stationsInBounds, updateVisibleStations);

  // 지도 범위 내 주유소 필터링 함수
  const filterStationsInBounds = (stations, bounds) => {
    if (!bounds) return [];
    return stations.filter(station => {
      if (!station.lat || !station.lng) return false;
      const position = new window.kakao.maps.LatLng(station.lat, station.lng);
      return bounds.contain(position);
    });
  };

  return {
    stationsInBounds,
    lowestPriceStations,
    visibleStations, // 지도 표시용 최종 목록
    filteredStations, // 전체 필터링 목록
    visibleCount,
    isSearching, // 지도 검색 로딩 상태
    currentMinPrice, // 최저가 (마커 스타일링용)
    canLoadMore, // 더 보기 버튼 표시 여부
    updateMapMarkersInBounds: updateMapMarkersInBounds, // 함수 이름 유지
    loadMore // 더 보기 함수
  };
}