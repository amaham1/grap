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
        <button @click="searchInCurrentMap" :disabled="isSearching || isLoading" class="search-btn">
          {{ isSearching ? '검색 중...' : '현재 지도에서 검색' }}
        </button>
      </div>
      <!-- 최저가 주유소 목록 (전체 기준 TOP 10) -->
      <div v-if="lowestPriceStations.length > 0" class="lowest-price-list" :class="{ 'collapsed': isLowestPriceListCollapsed }">
        <div class="list-header">
          <div class="header-left">
            <!-- 제목 수정 -->
            <h4>최저가 TOP 10 (가까운 순)</h4>
            <!-- 거리순 토글 버튼 제거 -->
          </div>
          <button @click="toggleLowestPriceList" class="toggle-list-btn">
            {{ isLowestPriceListCollapsed ? '펼치기' : '접기' }}
          </button>
        </div>
        <!-- v-show 제거, v-for 대상을 displayedLowestStations로 변경 -->
        <ul>
          <!-- panToStation 함수는 이제 이 컴포넌트에 있음 -->
          <li v-for="station in displayedLowestStations" :key="station.id" @click="panToStation(station)">
            <div class="station-info">
              <strong>{{ station.osnm }}</strong>
              <!-- formatPrice는 formatters.js에서 가져옴 -->
              <span class="price">{{ formatPrice(station.id, fuelPrices, selectedFuelType, fuelTypes) }}</span>
            </div>
            <!-- formatDistance는 formatters.js에서 가져옴 -->
            <div class="station-distance">{{ formatStationDistance(station, userLocation, isCalculatingDistances, lowestPriceStations) }}</div>
          </li>
        </ul>
        <!-- 더 많은 항목이 있음을 나타내는 시각적 표시 -->
        <div v-if="isLowestPriceListCollapsed && lowestPriceStations.length > 1" class="more-indicator">
          <span>...</span>
        </div>
      </div>
      <!-- '더 보기' 버튼 (지도 내 주유소 기준) -->
      <div v-if="canLoadMore" class="load-more-container">
        <!-- loadMore는 useStationFiltering에서 가져옴 -->
        <button @click="loadMore" class="load-more-btn">더 보기</button>
      </div>
      <div v-if="isLoading" class="loading-indicator">데이터를 불러오는 중...</div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div id="map" :class="{ 'map-hidden': isLoading || error }"></div>
      <!-- 내 위치로 이동 버튼 -->
      <button @click="moveToCurrentLocation" class="current-location-btn" title="내 위치로 이동">
        <img src="@/assets/images/icon/my-location.png" alt="내 위치" style="width: 20px; height: 20px;">
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, computed, reactive } from 'vue';
import { useKakaoMap } from '../composables/useKakaoMap'; // 원래 상대 경로로 복구
import { useFuelInfo } from '../composables/useFuelInfo';
import { useStationFiltering } from '../composables/useStationFiltering';
import { useMapDisplay } from '../composables/useMapDisplay';
import { formatPrice, formatStationDistance } from '@/utils/formatters'; // formatDistance -> formatStationDistance
import { getCurrentLocation } from '@/utils/geolocationUtils'; // getCurrentLocation import 추가

// --- 기본 상태 및 composable 초기화 ---
const { loadKakaoMapScript, initMap, displayCurrentLocation } = useKakaoMap(); // getCurrentLocationAsync 제거
const { fuelInfo, fuelPrices, isLoading: isLoadingData, error, getFuelData, calculateDistances, isCalculatingDistances } = useFuelInfo();

const mapInstance = ref(null);
const userLocation = ref(null);
const selectedFuelType = ref('gasoline');
const selectedCity = ref('제주시'); // 기본 선택 도시를 '제주시'로 변경
const isSingleStationView = ref(false); // 단일 주유소 보기 모드 상태
const selectedSingleStation = ref(null); // 단일 보기 시 선택된 주유소

// --- 상수 정의 ---
const fuelTypes = [ { text: '휘발유', value: 'gasoline' }, { text: '고급휘발유', value: 'premium_gasoline' }, { text: '경유', value: 'diesel' }, { text: 'LPG', value: 'lpg' }];
// '전체' 옵션 제거
const cities = [ { text: '제주시', value: '제주시' }, { text: '서귀포시', value: '서귀포시' }];

// --- 필터링 composable 사용 ---
const {
  stationsInBounds,
  lowestPriceStations,
  visibleStations,
  filteredStations,
  isSearching,
  canLoadMore,
  updateMapMarkersInBounds,
  loadMore,
  currentMinPrice // currentMinPrice 추가
} = useStationFiltering(
    fuelInfo,
    fuelPrices,
    selectedFuelType,
    selectedCity,
    mapInstance,
    userLocation // userLocation 인자 추가
);

// --- 지도 표시 composable 사용 ---
const {
  markers,
  infowindows,
  displayMarkers
} = useMapDisplay(
    mapInstance,
    visibleStations,
    filteredStations, // allFilteredStations 전달 (useStationFiltering에서 반환)
    lowestPriceStations,
    fuelInfo,
    fuelPrices,
    selectedFuelType,
    ref(fuelTypes),
    userLocation,
    isCalculatingDistances,
    isSingleStationView,
    selectedSingleStation,
    currentMinPrice // currentMinPrice 전달 (useStationFiltering에서 반환)
);

// --- 전체 로딩 상태 ---
const isLoading = computed(() => isLoadingData.value || isSearching.value);
const initialCalcDone = ref(false); // 초기 거리 계산 완료 플래그

// 초기 거리 계산 조건 충족 여부
// isReadyForInitialCalc computed 속성 제거

// --- 생명주기 훅 ---
onMounted(async () => {
  let initialCenter = { lat: 33.4996, lng: 126.5312 };
  try {
    // getCurrentLocation 사용 (geolocationUtils에서 import)
    const position = await getCurrentLocation();
    const fetchedLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
    initialCenter = fetchedLocation;
    userLocation.value = fetchedLocation; // userLocation 업데이트
  } catch (locationError) {
    console.error("Failed to get initial location:", locationError);
    userLocation.value = null; // 위치 가져오기 실패 시 null 설정
  }

  // 지도 초기화 및 데이터 로드는 try-catch 블록 밖으로 이동 (위치 실패해도 진행)
  try {

    if (!window.kakao || !window.kakao.maps) await loadKakaoMapScript();

    const { mapInstance: initializedMap, error: mapError } = initMap('map', initialCenter, 5);
    if (mapError) throw new Error(mapError);
    if (!initializedMap || !initializedMap.value) throw new Error("Failed to get map instance.");
    mapInstance.value = initializedMap.value;

    displayCurrentLocation(mapInstance);
    await getFuelData();

    // 데이터 로드 후 초기 목록 및 지도 마커 동시 업데이트
    // isSingleStationView 상태 초기화 추가
    isSingleStationView.value = false;
    await updateMapMarkersInBounds(true); // composable에서 반환된 이름 사용
    // 초기 거리 계산 로직은 watch에서 처리하도록 이동
  } catch (mountError) { // mount 관련 에러 처리
    console.error('Error during component mount (map/data loading):', mountError);
    const mapDiv = document.getElementById('map');
    if (mapDiv) mapDiv.innerHTML = '지도 또는 데이터를 불러오는 중 오류가 발생했습니다.';
  }
});

// --- Watchers ---
// 필터 변경 시 목록/마커 업데이트 및 거리 재계산
watch(selectedFuelType, async () => { // async 추가
  // console.log(`Fuel type changed: ${selectedFuelType.value}. Updating list and map markers...`);
  isSingleStationView.value = false; // 필터 변경 시 단일 보기 모드 해제
  await updateMapMarkersInBounds(); // 목록/마커 업데이트 기다림 (선택적)
  // 목록 업데이트 후 거리 재계산
  if (userLocation.value && lowestPriceStations.value.length > 0) {
    // console.log("Fuel type changed: Recalculating distances for new TOP 10.");
    calculateDistances(lowestPriceStations.value, userLocation.value);
  }
});

watch(selectedCity, async () => { // async 추가
  // console.log(`City filter changed: ${selectedCity.value}. Updating list and map markers...`);
  isSingleStationView.value = false; // 필터 변경 시 단일 보기 모드 해제
  await updateMapMarkersInBounds(); // 목록/마커 업데이트 기다림 (선택적)
  // 목록 업데이트 후 거리 재계산
  if (userLocation.value && lowestPriceStations.value.length > 0) {
    // console.log("City filter changed: Recalculating distances for new TOP 10.");
    calculateDistances(lowestPriceStations.value, userLocation.value);
  }
});

// 사용자 위치 변경 또는 초기 로드 시 거리 재계산 트리거
watch(userLocation, (newLocation, oldLocation) => {
  // newLocation이 유효하고, (oldLocation이 없거나 || 위치가 실제로 변경되었을 때)
  if (newLocation && (!oldLocation || newLocation.lat !== oldLocation.lat || newLocation.lng !== oldLocation.lng)) {
    const isInitialLoad = !oldLocation; // 초기 로드 여부 확인
    const logPrefix = isInitialLoad ? "Initial location loaded" : "User location changed";

    // console.log(`${logPrefix}. Checking conditions to calculate distances for TOP 10.`);
    // 최저가 목록이 준비되었는지 확인 후 거리 계산 호출
    if (lowestPriceStations.value && lowestPriceStations.value.length > 0) {
      // console.log(`${logPrefix}: Lowest stations ready. Calculating distances.`);
      calculateDistances(lowestPriceStations.value, newLocation);
    } else {
      // console.log(`${logPrefix}: Lowest stations not ready yet. Distance calculation deferred.`);
      // lowestPriceStations가 나중에 준비되면 필터 watch에서 처리될 수 있음
      // 또는, lowestPriceStations를 여기서 watch하는 로직을 추가할 수도 있지만,
      // 현재 구조에서는 필터 watch가 그 역할을 할 것으로 기대됨.
    }
  }
}, { deep: true }); // userLocation 객체 내부 변경 감지

// lowestPriceStations 감시 watch 제거됨

// 초기 로드 시 거리 계산 트리거 (조건 충족 시 단 한번 실행)
// isReadyForInitialCalc watcher 제거

// lowestPriceStations 변경 시 초기 거리 계산 트리거 (최초 1회만 실행)
watch(lowestPriceStations, (newStations) => {
  // lowestPriceStations 변경 시 초기 거리 계산 트리거 (최초 1회만 실행)
  if (!initialCalcDone.value && userLocation.value && newStations && newStations.length > 0) {
    calculateDistances(newStations, userLocation.value);
    initialCalcDone.value = true; // 초기 계산 완료 표시
  }
}, { immediate: false }); // immediate: false로 설정하여 초기값으로는 실행되지 않도록 함 (데이터 로드 후 변경 시 실행)

// 거리 계산 완료 시 UI 업데이트 (useMapDisplay 내부에서 처리)

// --- 컴포넌트 메소드 ---
// 목록 항목 클릭 시 지도 이동 및 인포윈도우 열기
const panToStation = (station) => {
  if (!mapInstance.value || !station.lat || !station.lng) return;
  const position = new window.kakao.maps.LatLng(station.lat, station.lng);

  isSingleStationView.value = true; // 단일 보기 모드 활성화
  selectedSingleStation.value = station; // 선택된 주유소 저장

  mapInstance.value.setCenter(position); // panTo 대신 setCenter 사용하여 즉시 이동

  // displayMarkers는 isSingleStationView/selectedSingleStation watch를 통해 호출됨
  // console.log(`Switched to single station view for: ${station.osnm}`);
};

// 최저가 목록 접기/펼치기 상태 (기본값 true로 변경)
const isLowestPriceListCollapsed = ref(true);
const toggleLowestPriceList = () => {
  isLowestPriceListCollapsed.value = !isLowestPriceListCollapsed.value;
};

// 표시할 최저가 주유소 목록 계산 (정렬 및 접힘 상태 반영)
const displayedLowestStations = computed(() => {
  let stations = [...lowestPriceStations.value]; // 원본 배열 복사

  // 정렬 로직 제거 (lowestPriceStations가 이미 거리순으로 정렬됨)

  // 접힘 상태 반영
  if (isLowestPriceListCollapsed.value) {
    return stations.slice(0, 1);
  }
  return stations;
});

// 내 위치로 이동하는 함수
const moveToCurrentLocation = async () => {
  if (!mapInstance.value) {
    console.error("Map instance is not available.");
    alert("지도를 먼저 로드해주세요.");
    return;
  }
  try {
    const position = await getCurrentLocation();
    const currentLatLng = new window.kakao.maps.LatLng(position.coords.latitude, position.coords.longitude);
    mapInstance.value.panTo(currentLatLng);
    // userLocation.value 업데이트는 선택 사항 (이미 onMounted에서 처리)
    // 필요 시 현재 위치 마커 업데이트 로직 추가
    // console.log("Moved map to current location:", currentLatLng);
  } catch (error) {
    console.error("Error getting current location:", error);
    alert(`현재 위치를 가져오는 데 실패했습니다: ${error.message}`);
  }
};

// '현재 지도에서 검색' 버튼 클릭 핸들러
const searchInCurrentMap = () => {
  if (isSingleStationView.value) {
    isSingleStationView.value = false; // 단일 보기 모드 해제
    // 상태 변경 후 마커 업데이트가 watch에서 처리될 때까지 잠시 기다릴 수 있음
    // 하지만 updateMapMarkersInBounds가 stationsInBounds를 변경하므로 watch가 트리거됨
    // console.log("Exited single station view by searching in map.");
  }
  updateMapMarkersInBounds(); // 기존 검색 로직 호출
}; // <<-- 올바른 닫는 중괄호와 세미콜론

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
  padding: 0 10px 10px 10px; /* 상단 패딩 제거, 헤더에서 처리 */
  transition: max-height 0.3s ease-out; /* 접기/펼치기 애니메이션 */
}

/* .collapsed 스타일에서 max-height와 overflow 제거 */
.lowest-price-list.collapsed {
  /* max-height와 overflow 제거 */
  padding-bottom: 10px; /* 접혔을 때도 하단 패딩 유지 (선택 사항) */
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0; /* 헤더 상하 패딩 */
  border-bottom: 1px solid #eee;
  margin-bottom: 5px; /* 헤더와 목록 사이 간격 */
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px; /* 제목과 정렬 버튼 사이 간격 */
}

.lowest-price-list h4 {
  margin: 0; /* 기본 마진 제거 */
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap; /* 제목 줄바꿈 방지 */
}

/* .sort-options 및 .distance-sort-btn 스타일 제거됨 */

.toggle-list-btn {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 12px;
  padding: 0 5px;
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

/* 내 위치로 이동 버튼 스타일 */
.current-location-btn {
  position: absolute;
  bottom: 90px; /* '더 보기' 버튼 위 또는 적절한 위치 */
  right: 20px;
  z-index: 10;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 50%; /* 원형 버튼 */
  width: 40px;
  height: 40px;
  padding: 0; /* 내부 여백 제거 */
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: background-color 0.2s, box-shadow 0.2s;
}

.current-location-btn:hover {
  background-color: #f8f8f8;
  box-shadow: 0 3px 6px rgba(0,0,0,0.3);
}

.current-location-btn svg {
  color: #555; /* 아이콘 색상 */
}
/* 모바일 반응형 스타일 */
@media (max-width: 768px) {
  .fuel-type-selector {
    /* 상단 좌측 정렬, 너비 조정 */
    position: absolute;
    top: 10px;
    left: 10px; /* 좌측 정렬 */
    transform: none; /* transform 제거 */
    width: calc(100% - 20px); /* 좌우 여백 10px */
    max-width: 400px; /* 최대 너비 약간 증가 */
    padding: 8px 12px; /* 패딩 조정 */
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-start; /* 좌측부터 배치 */
  }

  .fuel-type-selector label {
    margin: 0 5px;
    font-size: 13px;
  }

  .city-selector {
    /* 유가 선택기 아래 좌측 */
    position: absolute;
    top: 75px; /* 상단 간격 조정 (fuel-type-selector 높이 고려) */
    left: 10px; /* 좌측 정렬 */
    width: auto;
    padding: 6px 10px;
  }

   .lowest-price-list {
    /* 도시 선택기 아래 좌측 */
    position: absolute;
    top: 115px; /* city-selector 아래 간격 조정 */
    left: 10px;
    width: calc(100% - 240px); /* 화면 너비에 맞게 조정 (좌우 여백 10px) */
    max-width: 300px; /* 최대 너비 약간 증가 */
    max-height: 250px; /* 높이 제한 약간 증가 */
    margin: 0;
  }

  .search-button-container {
    /* 화면 하단 중앙 */
    position: absolute;
    top: auto; /* top 속성 제거 */
    bottom: 20px; /* 화면 하단에 배치 */
    left: 50%;
    transform: translateX(-50%);
    width: auto;
    z-index: 11;
  }

  .search-btn {
     /* 버튼 크기 조정 */
     padding: 10px 20px;
     font-size: 14px;
  }

  .load-more-container {
     /* 하단 중앙 ('현재 지도 검색' 버튼 위) */
    position: absolute;
    bottom: 70px; /* search-button-container 위로 조정 */
    left: 50%;
    transform: translateX(-50%);
    width: auto;
    z-index: 11;
  }

  .current-location-btn {
    /* 하단 우측 유지, 여백 조정 */
    bottom: 20px;
    right: 15px;
    width: 35px;
    height: 35px;
  }
  .current-location-btn img {
      width: 18px;
      height: 18px;
  }

  /* 모바일: 최저가 목록 헤더 레이아웃 조정 */
  .list-header {
    flex-direction: column; /* 세로 배치 */
    align-items: flex-start; /* 왼쪽 정렬 */
    padding-bottom: 5px; /* 하단 패딩 조정 */
  }

  .toggle-list-btn {
    margin-top: 5px; /* 제목 아래 간격 */
    padding: 2px 5px; /* 패딩 조정 */
    align-self: flex-end; /* 오른쪽 끝으로 이동 */
  }

  /* 모바일: 최저가 목록 아이템 레이아웃 조정 */
  .station-info {
    flex-direction: column; /* 세로 배치 */
    align-items: flex-start; /* 왼쪽 정렬 */
  }

  .price {
    margin-top: 3px; /* 주유소 이름 아래 간격 */
    font-size: 14px; /* 가격 폰트 약간 키움 */
  }

  .station-distance {
      margin-top: 2px; /* 가격 아래 간격 */
  }
}

</style>
