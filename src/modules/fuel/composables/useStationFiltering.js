// src/modules/fuel/composables/useStationFiltering.js
import { ref, computed, watch, nextTick } from 'vue';

export function useStationFiltering(fuelInfo, fuelPrices, selectedFuelType, selectedCity, mapInstance) {
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

  // lowestPriceStations를 computed 속성으로 정의
  const lowestPriceStations = computed(() => {
    // 의존성: fuelInfo, fuelPrices, selectedFuelType, selectedCity
    if (!Array.isArray(fuelInfo.value) || fuelInfo.value.length === 0 || Object.keys(fuelPrices.value).length === 0) {
      console.warn("[Filtering Computed] Data not ready for lowest price list.");
      return [];
    }
    console.log("[Filtering Computed] Calculating lowest price list based on filters...");

    const allFilteredStations = fuelInfo.value.filter(station => {
      const prices = fuelPrices.value[station.id];
      const cityFilter = selectedCity.value === '전체' || (station.adr && station.adr.includes(selectedCity.value));
      const price = prices ? prices[selectedFuelType.value] : undefined;
      const hasValidPrice = typeof price === 'number' && price > 0;

      if (selectedFuelType.value === 'lpg') {
        return hasValidPrice && cityFilter && station.lpgyn === 'Y';
      }
      return hasValidPrice && cityFilter;
    });

    allFilteredStations.sort((a, b) => {
        const priceA = fuelPrices.value[a.id]?.[selectedFuelType.value] ?? Infinity;
        const priceB = fuelPrices.value[b.id]?.[selectedFuelType.value] ?? Infinity;
        return priceA - priceB;
    });

    const top10 = allFilteredStations.slice(0, 10);
    console.log(`[Filtering Computed] Found ${top10.length} lowest price stations.`);
    // computed는 내부 요소의 변경(distance)도 감지하여 재계산하므로,
    // distance가 포함된 최신 station 객체를 반환함.
    return top10;
  });

  // currentMinPrice도 computed로 정의
  const currentMinPrice = computed(() => {
    if (lowestPriceStations.value.length > 0) {
      // lowestPriceStations computed가 최신 가격 정보를 반영하므로 여기서 가져옴
      return fuelPrices.value[lowestPriceStations.value[0].id]?.[selectedFuelType.value] ?? Infinity;
    }
    return Infinity;
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
    console.log("[Filtering] Updating map markers based on current bounds and filters...");

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
    const allFilteredStationsForBounds = fuelInfo.value.filter(station => {
        const prices = fuelPrices.value[station.id];
        const cityFilter = selectedCity.value === '전체' || (station.adr && station.adr.includes(selectedCity.value));
        const price = prices ? prices[selectedFuelType.value] : undefined;
        const hasValidPrice = typeof price === 'number' && price > 0;
        if (selectedFuelType.value === 'lpg') {
            return hasValidPrice && cityFilter && station.lpgyn === 'Y';
        }
        return hasValidPrice && cityFilter;
    });

    // --- 2. 지도 범위 내 마커 업데이트 로직 (기존 로직 유지) ---
    console.log("[Filtering] Updating map markers based on current bounds...");

    // allFilteredStationsForBounds에서 지도 범위 내 주유소 찾기
    stationsInBounds.value = allFilteredStationsForBounds.filter(station => {
        if (!station.lat || !station.lng) return false;
        const position = new window.kakao.maps.LatLng(station.lat, station.lng);
        return bounds.contain(position);
    });
    console.log(`[Filtering] Found ${stationsInBounds.value.length} stations within map bounds to display.`);
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
    console.log(`[Filtering] Updating visible stations state: ${visibleStations.value.length}`);
    // 실제 마커 표시는 useMapDisplay에서 visibleStations를 watch하여 처리
  };

  // '더 보기' 함수 (지도 내 주유소 기준)
  const loadMore = () => {
    visibleCount.value += LOAD_MORE_COUNT;
    updateVisibleStations(); // visibleStations 업데이트
  };

  // stationsInBounds 변경 시 visibleStations 업데이트 (초기 로드 및 필터링 후)
  watch(stationsInBounds, updateVisibleStations);

  return {
    stationsInBounds,
    lowestPriceStations,
    visibleStations, // 지도 표시용 최종 목록
    visibleCount,
    isSearching, // 지도 검색 로딩 상태
    currentMinPrice, // 최저가 (마커 스타일링용)
    canLoadMore, // 더 보기 버튼 표시 여부
    updateMapMarkersInBounds: updateMapMarkersInBounds, // 함수 이름 유지
    loadMore // 더 보기 함수
  };
}