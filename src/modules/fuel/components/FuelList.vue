<template>
  <div class="fuel-list-container">
    <div class="map-wrapper">
      <!-- 컨트롤 요소들 -->
      <div class="fuel-type-selector">
        <label v-for="fuel in fuelTypes" :key="fuel.value">
          <input type="radio" v-model="selectedFuelType" :value="fuel.value" name="fuelType">
          {{ fuel.text }}
        </label>
      </div>
      <div class="city-selector">
        <label v-for="city in cities" :key="city.value">
          <input type="radio" v-model="selectedCity" :value="city.value" name="city">
          {{ city.text }}
        </label>
      </div>
      <div class="search-button-container">
        <!-- 버튼 클릭 시 updateMapMarkersInBounds 호출 -->
        <button @click="updateMapMarkersInBounds" :disabled="isSearching || isLoading" class="search-btn">
          {{ isSearching ? '검색 중...' : '현재 지도에서 검색' }}
        </button>
      </div>
      <!-- 최저가 주유소 목록 (전체 기준 TOP 10) -->
      <div v-if="lowestPriceStations.length > 0" class="lowest-price-list">
        <h4>최저가 주유소 TOP 10</h4>
        <ul>
          <!-- panToStation 함수는 이제 이 컴포넌트에 있음 -->
          <li v-for="station in lowestPriceStations" :key="station.id" @click="panToStation(station)">
            <div class="station-info">
              <strong>{{ station.osnm }}</strong>
              <!-- formatPrice는 formatters.js에서 가져옴 -->
              <span class="price">{{ formatPrice(station.id, fuelPrices, selectedFuelType, fuelTypes) }}</span>
            </div>
            <!-- formatDistance는 formatters.js에서 가져옴 -->
            <div class="station-distance">{{ formatDistance(station, userLocation, isCalculatingDistances, lowestPriceStations) }}</div>
          </li>
        </ul>
      </div>
      <!-- '더 보기' 버튼 (지도 내 주유소 기준) -->
      <div v-if="canLoadMore" class="load-more-container">
        <!-- loadMore는 useStationFiltering에서 가져옴 -->
        <button @click="loadMore" class="load-more-btn">더 보기</button>
      </div>
      <div v-if="isLoading" class="loading-indicator">데이터를 불러오는 중...</div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div id="map" :class="{ 'map-hidden': isLoading || error }"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, computed, reactive } from 'vue';
import { useKakaoMap } from '../composables/useKakaoMap';
import { useFuelInfo } from '../composables/useFuelInfo';
import { useStationFiltering } from '../composables/useStationFiltering';
import { useMapDisplay } from '../composables/useMapDisplay';
import { formatPrice, formatDistance } from '@/utils/formatters';

// --- 기본 상태 및 composable 초기화 ---
const { loadKakaoMapScript, initMap, getCurrentLocationAsync, displayCurrentLocation } = useKakaoMap();
const { fuelInfo, fuelPrices, isLoading: isLoadingData, error, getFuelData, calculateDistances, isCalculatingDistances } = useFuelInfo();

const mapInstance = ref(null);
const userLocation = ref(null);
const selectedFuelType = ref('gasoline');
const selectedCity = ref('전체');

// --- 상수 정의 ---
const fuelTypes = [ { text: '휘발유', value: 'gasoline' }, { text: '고급휘발유', value: 'premium_gasoline' }, { text: '경유', value: 'diesel' }, { text: 'LPG', value: 'lpg' }];
const cities = [ { text: '전체', value: '전체' }, { text: '제주시', value: '제주시' }, { text: '서귀포시', value: '서귀포시' }];

// --- 필터링 composable 사용 ---
const {
  stationsInBounds,
  lowestPriceStations,
  visibleStations,
  isSearching,
  canLoadMore,
  updateMapMarkersInBounds, // composable에서 반환된 이름 사용
  loadMore
} = useStationFiltering( // userLocation, calculateDistances 인자 제거
    fuelInfo,
    fuelPrices,
    selectedFuelType,
    selectedCity,
    mapInstance
);

// --- 지도 표시 composable 사용 ---
const {
  markers,
  infowindows,
  displayMarkers
} = useMapDisplay(
    mapInstance,
    visibleStations,
    lowestPriceStations,
    fuelInfo,
    fuelPrices,
    selectedFuelType,
    ref(fuelTypes),
    userLocation,
    isCalculatingDistances
);

// --- 전체 로딩 상태 ---
const isLoading = computed(() => isLoadingData.value || isSearching.value);
const initialCalcDone = ref(false); // 초기 거리 계산 완료 플래그

// 초기 거리 계산 조건 충족 여부
const isReadyForInitialCalc = computed(() =>
  !initialCalcDone.value && // 아직 초기 계산 전이고
  userLocation.value && // 사용자 위치가 있고
  lowestPriceStations.value && lowestPriceStations.value.length > 0 // 최저가 목록이 있을 때
);

// --- 생명주기 훅 ---
onMounted(async () => {
  let initialCenter = { lat: 33.4996, lng: 126.5312 };
  try {
    const fetchedLocation = await getCurrentLocationAsync();
    if (fetchedLocation) {
      initialCenter = fetchedLocation;
      userLocation.value = fetchedLocation;
    } else {
      userLocation.value = null;
    }

    if (!window.kakao || !window.kakao.maps) await loadKakaoMapScript();

    const { mapInstance: initializedMap, error: mapError } = initMap('map', initialCenter, 5);
    if (mapError) throw new Error(mapError);
    if (!initializedMap || !initializedMap.value) throw new Error("Failed to get map instance.");
    mapInstance.value = initializedMap.value;

    displayCurrentLocation(mapInstance);
    await getFuelData();

    // 데이터 로드 후 초기 목록 및 지도 마커 동시 업데이트
    await updateMapMarkersInBounds(true); // composable에서 반환된 이름 사용
    // 초기 거리 계산 로직은 watch에서 처리하도록 이동
  } catch (err) {
    console.error('Error during component mount:', err);
    const mapDiv = document.getElementById('map');
    if (mapDiv) mapDiv.innerHTML = '지도 또는 데이터를 불러오는 중 오류가 발생했습니다.';
  }
});

// --- Watchers ---
// 필터 변경 시 목록/마커 업데이트 및 거리 재계산
watch(selectedFuelType, async () => { // async 추가
  console.log(`Fuel type changed: ${selectedFuelType.value}. Updating list and map markers...`);
  await updateMapMarkersInBounds(); // 목록/마커 업데이트 기다림 (선택적)
  // 목록 업데이트 후 거리 재계산
  if (userLocation.value && lowestPriceStations.value.length > 0) {
    console.log("Fuel type changed: Recalculating distances for new TOP 10.");
    calculateDistances(lowestPriceStations.value, userLocation.value);
  }
});

watch(selectedCity, async () => { // async 추가
  console.log(`City filter changed: ${selectedCity.value}. Updating list and map markers...`);
  await updateMapMarkersInBounds(); // 목록/마커 업데이트 기다림 (선택적)
  // 목록 업데이트 후 거리 재계산
  if (userLocation.value && lowestPriceStations.value.length > 0) {
    console.log("City filter changed: Recalculating distances for new TOP 10.");
    calculateDistances(lowestPriceStations.value, userLocation.value);
  }
});

// 사용자 위치 변경 또는 초기 로드 시 거리 재계산 트리거
watch(userLocation, (newLocation, oldLocation) => {
  // newLocation이 유효하고, (oldLocation이 없거나 || 위치가 실제로 변경되었을 때)
  if (newLocation && (!oldLocation || newLocation.lat !== oldLocation.lat || newLocation.lng !== oldLocation.lng)) {
    const isInitialLoad = !oldLocation; // 초기 로드 여부 확인
    const logPrefix = isInitialLoad ? "Initial location loaded" : "User location changed";

    console.log(`${logPrefix}. Checking conditions to calculate distances for TOP 10.`);
    // 최저가 목록이 준비되었는지 확인 후 거리 계산 호출
    if (lowestPriceStations.value && lowestPriceStations.value.length > 0) {
      console.log(`${logPrefix}: Lowest stations ready. Calculating distances.`);
      calculateDistances(lowestPriceStations.value, newLocation);
    } else {
      console.log(`${logPrefix}: Lowest stations not ready yet. Distance calculation deferred.`);
      // lowestPriceStations가 나중에 준비되면 필터 watch에서 처리될 수 있음
      // 또는, lowestPriceStations를 여기서 watch하는 로직을 추가할 수도 있지만,
      // 현재 구조에서는 필터 watch가 그 역할을 할 것으로 기대됨.
    }
  }
}, { deep: true }); // userLocation 객체 내부 변경 감지

// lowestPriceStations 감시 watch 제거됨

// 초기 로드 시 거리 계산 트리거 (조건 충족 시 단 한번 실행)
watch(isReadyForInitialCalc, (ready) => {
  if (ready) {
    console.log("Conditions met for initial distance calculation.");
    calculateDistances(lowestPriceStations.value, userLocation.value);
    initialCalcDone.value = true; // 초기 계산 완료 표시
  }
});

// 거리 계산 완료 시 UI 업데이트 (useMapDisplay 내부에서 처리)

// --- 컴포넌트 메소드 ---
// 목록 항목 클릭 시 지도 이동 및 인포윈도우 열기
const panToStation = async (station) => {
  if (!mapInstance.value || !station.lat || !station.lng) return;
  const position = new window.kakao.maps.LatLng(station.lat, station.lng);
  mapInstance.value.panTo(position);

  let targetMarker = markers.value.find(m => m.getTitle() === station.osnm);

  // 마커가 현재 지도에 없다면, 해당 위치 기준으로 마커 로드 시도
  if (!targetMarker) {
    console.log(`Marker for ${station.osnm} not found in current view. Reloading markers...`);
    await updateMapMarkersInBounds(false); // composable에서 반환된 이름 사용
    // 마커 로드 후 다시 찾기 (displayMarkers가 비동기적으로 완료될 수 있으므로 약간의 지연 고려)
    await new Promise(resolve => setTimeout(resolve, 100));
    targetMarker = markers.value.find(m => m.getTitle() === station.osnm);
  }

  // 최종적으로 마커 찾아서 클릭 이벤트 트리거
  if (targetMarker) {
      console.log(`Triggering click event for marker: ${station.osnm}`);
      window.kakao.maps.event.trigger(targetMarker, 'click');
  } else {
      console.warn("Marker still not found after reloading for station:", station.osnm);
  }
};

</script>

<style scoped>
/* 스타일은 이전과 동일하게 유지 */
.fuel-type-selector {
  position: absolute; /* map-wrapper 기준 */
  top: 20px; /* 상단 여백 */
  left: 50%;
  transform: translateX(-50%); /* 가로 중앙 정렬 */
  z-index: 10; /* 지도 위에 표시 */
  background-color: rgba(255, 255, 255, 0.9); /* 배경 약간 더 불투명하게 */
  padding: 8px 15px;
  border-radius: 20px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  display: flex;
  gap: 15px;
}

.fuel-type-selector label {
  margin: 0 10px;
  cursor: pointer;
}

/* 도시 선택기 스타일 */
.city-selector {
  position: absolute;
  top: 70px; /* 유가 선택기 아래 + 여백 */
  left: 20px; /* 좌측 여백 */
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 8px 10px;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  display: flex;
  gap: 10px;
}

.city-selector label {
  margin: 0 5px;
  cursor: pointer;
  font-size: 13px;
}

/* '현재 지도에서 검색' 버튼 스타일 */
.search-button-container {
  position: absolute;
  top: 115px; /* 도시 선택기 아래 + 여백 */
  left: 20px; /* 도시 선택기와 같은 좌측 정렬 */
  z-index: 10;
}

.search-btn {
  padding: 8px 15px;
  background-color: #007bff; /* 파란색 계열 */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 13px;
}

.search-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.search-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* 최저가 주유소 목록 스타일 */
.lowest-price-list {
  position: absolute;
  top: 155px; /* 검색 버튼 아래 + 여백 */
  left: 20px; /* 좌측 여백 */
  width: 250px; /* 너비 지정 */
  max-height: calc(100% - 175px); /* 상단 컨트롤 영역 높이 증가 반영 + 하단 여백 고려 */
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  z-index: 10;
  overflow-y: auto; /* 내용 많으면 스크롤 */
  padding: 10px;
}

.lowest-price-list h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.lowest-price-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.lowest-price-list li {
  padding: 8px 5px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.lowest-price-list li:last-child {
  border-bottom: none;
}

.lowest-price-list li:hover {
  background-color: #f9f9f9;
}

.lowest-price-list .station-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  margin-bottom: 3px;
}

.lowest-price-list .station-info strong {
  flex-grow: 1; /* 이름 길어지면 공간 차지 */
  margin-right: 5px; /* 가격과의 간격 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* 이름 길면 ... 처리 */
}

.lowest-price-list .price {
  font-weight: bold;
  color: #007bff; /* 가격 강조 */
  white-space: nowrap; /* 가격 줄바꿈 방지 */
}

.lowest-price-list .station-distance {
  font-size: 11px;
  color: #666;
}


/* '더 보기' 버튼 스타일 */
.load-more-container {
  position: absolute;
  bottom: 20px; /* 하단에 위치 */
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.load-more-btn {
  padding: 8px 15px;
  background-color: #28a745; /* 초록색 계열 */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 13px;
}

.load-more-btn:hover {
  background-color: #218838;
}

.fuel-list-container {
  position: absolute; /* 부모(<main>) 기준 절대 위치 */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1; /* 사이드바 광고 아래 */
  display: flex; /* map-wrapper 중앙 정렬 */
  align-items: center;
  justify-content: center;
  overflow: hidden; /* 스크롤 방지 */
}

.map-wrapper {
  position: relative; /* 내부 절대 위치 요소(컨트롤, 로딩/에러) 기준 */
  width: 100%;
  height: 100%;
  max-width: 1280px;
  overflow: hidden; /* 내부 요소가 넘칠 경우 숨김 */
}

#map {
  width: 100%;
  height: 100%; /* map-wrapper 높이에 맞춤 */
  transition: opacity 0.3s ease; /* 부드러운 전환 효과 */
}

.map-hidden {
  opacity: 0;
  height: 0; /* 공간 차지 않도록 */
  overflow: hidden;
}

.loading-indicator,
.error-message {
  position: absolute; /* map-wrapper 기준 */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 15px 25px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 8px;
  z-index: 10; /* 맵 위에 오도록 */
  text-align: center;
}

.error-message {
  background-color: rgba(220, 53, 69, 0.8); /* 빨간색 배경 */
}

</style>
