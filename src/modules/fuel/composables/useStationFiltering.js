// src/modules/fuel/composables/useStationFiltering.js
import { ref, computed, watch, nextTick } from 'vue';

export function useStationFiltering(fuelInfo, fuelPrices, selectedFuelType, selectedCity, mapInstance) {
  const stationsInBounds = ref([]); // 지도 범위 내 필터링된 주유소 (마커 표시용)
  const lowestPriceStations = ref([]); // 전체 데이터 기준 필터링된 최저가 TOP 10 (목록 표시용)
  const visibleStations = ref([]); // 실제로 지도에 표시될 주유소 (stationsInBounds 기반)
  const visibleCount = ref(10);
  const INITIAL_VISIBLE_COUNT = 10;
  const LOAD_MORE_COUNT = 10;
  const isSearching = ref(false); // 지도 검색 로딩 상태
  let currentMinPrice = ref(Infinity); // lowestPriceStations 중 최저가

  // '더 보기' 버튼 표시 여부 (지도 내 주유소 기준)
  const canLoadMore = computed(() => stationsInBounds.value.length > visibleStations.value.length);

  // 전체 데이터 기준 최저가 목록 업데이트 함수
  const updateLowestPriceList = () => {
    if (!Array.isArray(fuelInfo.value) || fuelInfo.value.length === 0 || Object.keys(fuelPrices.value).length === 0) {
      console.warn("[Filtering] Data not ready for updating lowest price list.");
      lowestPriceStations.value = [];
      currentMinPrice.value = Infinity;
      return;
    }
    console.log("[Filtering] Updating lowest price list based on filters...");

    const allFilteredStations = fuelInfo.value.filter(station => {
      const prices = fuelPrices.value[station.id];
      const cityFilter = selectedCity.value === '전체' || (station.adr && station.adr.includes(selectedCity.value));
      const price = prices ? prices[selectedFuelType.value] : undefined;
      const hasValidPrice = typeof price === 'number' && price > 0;

      // LPG 선택 시 lpgyn 플래그 추가 확인 ('Y'인 경우만)
      if (selectedFuelType.value === 'lpg') {
        return hasValidPrice && cityFilter && station.lpgyn === 'Y';
      }

      // 그 외 유종은 가격과 도시 필터만 확인
      return hasValidPrice && cityFilter;
    });

    allFilteredStations.sort((a, b) => {
        const priceA = fuelPrices.value[a.id]?.[selectedFuelType.value] ?? Infinity;
        const priceB = fuelPrices.value[b.id]?.[selectedFuelType.value] ?? Infinity;
        return priceA - priceB;
    });

    lowestPriceStations.value = allFilteredStations.slice(0, 10);
    console.log(`[Filtering] Found ${lowestPriceStations.value.length} lowest price stations.`);

    if (lowestPriceStations.value.length > 0) {
        currentMinPrice.value = fuelPrices.value[lowestPriceStations.value[0].id]?.[selectedFuelType.value] ?? Infinity;
    } else {
        currentMinPrice.value = Infinity;
    }
  };

  // 최저가 목록 및 지도 범위 내 마커 업데이트 함수
  const updateLowestPriceAndMapMarkers = async (isInitialLoad = false) => {
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

    // --- 1. 최저가 목록 업데이트 로직 (updateLowestPriceList 내용 통합) ---
    console.log("[Filtering] Updating lowest price list based on filters...");
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

    lowestPriceStations.value = allFilteredStations.slice(0, 10);
    console.log(`[Filtering] Found ${lowestPriceStations.value.length} lowest price stations.`);

    if (lowestPriceStations.value.length > 0) {
        currentMinPrice.value = fuelPrices.value[lowestPriceStations.value[0].id]?.[selectedFuelType.value] ?? Infinity;
    } else {
        currentMinPrice.value = Infinity;
    }
    // --- 최저가 목록 업데이트 로직 끝 ---

    // --- 2. 지도 범위 내 마커 업데이트 로직 (기존 로직 유지) ---
    console.log("[Filtering] Updating map markers based on current bounds...");

    // allFilteredStations (이미 필터링된 목록)에서 지도 범위 내 주유소 찾기
    stationsInBounds.value = allFilteredStations.filter(station => {
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
    // updateLowestPriceList, // 함수 통합으로 제거
    updateMapMarkersInBounds: updateLowestPriceAndMapMarkers, // 이름 변경된 함수 할당
    loadMore // 더 보기 함수
  };
}