<template>
  <div class="fuel-list-container">
    <div class="map-wrapper">
      <!-- 컨트롤 요소들을 map-wrapper 안으로 이동 -->
      <div class="fuel-type-selector">
        <label v-for="fuel in fuelTypes" :key="fuel.value">
          <input type="radio" v-model="selectedFuelType" :value="fuel.value" name="fuelType">
          {{ fuel.text }}
        </label>
      </div>
      <!-- '현재 지도에서 검색' 버튼 -->
      <div class="search-button-container">
        <button @click="searchInBounds" :disabled="isSearching || isLoading" class="search-btn">
          {{ isSearching ? '검색 중...' : '현재 지도에서 검색' }}
        </button>
      </div>
      <!-- '더 보기' 버튼 (조건부 렌더링) -->
      <div v-if="canLoadMore" class="load-more-container">
        <button @click="loadMore" class="load-more-btn">더 보기</button>
      </div>
      <div v-if="isLoading" class="loading-indicator">데이터를 불러오는 중...</div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div id="map" :class="{ 'map-hidden': isLoading || error }"></div>
      <!-- TODO: 주유소 목록 표시 또는 상세 정보 표시 UI 추가 -->
    </div>
  </div>
  <!-- .toggle-button-container는 위에서 map-wrapper 안으로 이동했으므로 이 부분 제거 -->
</template>

<script setup>
import { onMounted, ref, watch, nextTick, computed } from 'vue';
import { useKakaoMap } from '../composables/useKakaoMap';
import { useFuelInfo } from '../composables/useFuelInfo'; // isCalculatingDistances 추가
import { calculateDistance } from '@/utils/geolocationUtils'; // 직선 거리 계산 함수 import 복원

const { loadKakaoMapScript, initMap, getCurrentLocationAsync, displayCurrentLocation } = useKakaoMap(); // getCurrentLocationAsync 추가
const { fuelInfo, fuelPrices, isLoading, error, getFuelData, calculateDistances, isCalculatingDistances } = useFuelInfo(); // calculateDistances, isCalculatingDistances 추가
const mapInstance = ref(null);
const markers = ref([]);
const infowindows = ref([]);
const userLocation = ref(null); // 초기 위치 설정용으로 유지
const selectedFuelType = ref('gasoline');

// 유가 종류 옵션 정의
const fuelTypes = [
  { text: '휘발유', value: 'gasoline' },
  { text: '고급휘발유', value: 'premium_gasoline' },
  { text: '경유', value: 'diesel' },
  { text: 'LPG', value: 'lpg' },
];

// 새로운 상태 변수들
const stationsInBounds = ref([]); // 현재 지도 범위 내 모든 주유소
const lowestPriceStations = ref([]); // 범위 내 최저가 주유소 목록
const otherStationsInBounds = ref([]); // 범위 내 일반 주유소 목록 (가격순 정렬)
const visibleStations = ref([]); // 실제로 지도에 표시될 주유소 (단계적 로딩)
const visibleCount = ref(10); // 한 번에 표시할 주유소 개수
const INITIAL_VISIBLE_COUNT = 10; // 초기 표시 개수
const LOAD_MORE_COUNT = 10; // 더 보기 시 추가 개수
const isSearching = ref(false); // 현재 범위 검색 로딩 상태
let currentMinPrice = ref(Infinity); // 현재 검색된 최저가 저장

// '더 보기' 버튼 표시 여부 computed 속성 수정
const canLoadMore = computed(() => {
  const totalAvailable = lowestPriceStations.value.length + otherStationsInBounds.value.length;
  return totalAvailable > visibleStations.value.length;
});

// toggleOtherStations 함수 제거

// 지도에 마커를 표시하는 함수 (visibleStations 기반으로 수정)
const displayMarkers = () => {
  if (!mapInstance.value) return;

  // 기존 마커 및 인포윈도우 제거
  infowindows.value.forEach(infowindow => infowindow.close());
  infowindows.value = [];
  markers.value.forEach(marker => marker.setMap(null));
  markers.value = [];

  // visibleStations가 유효한 배열인지 확인 (방어 코드)
  if (!Array.isArray(visibleStations.value) || visibleStations.value.length === 0) {
    console.log("No stations to display or visibleStations is not ready.");
    return;
  }

  console.log(`Displaying ${visibleStations.value.length} markers.`);

  // console.log(`Displaying ${nearbyStations.length} markers within ${MAX_DISTANCE_KM}km.`); // 필요시 주석 해제

  // console.log("nnnnnnn ", nearbyStations) // 사용자 추가 로그 제거
  // 필터링된 주유소 정보 콘솔에 테이블 형태로 출력
  // if (nearbyStations.length > 0) { // 필요시 주석 해제하여 테이블 로그 확인
  //   console.table(nearbyStations.map(station => ({
  //     '상호': station.osnm,
  //     '위도': station.lat,
  //     '경도': station.lng
  //   })));
  // }

  const newMarkers = [];
  const newInfowindows = [];

  // 마커 이미지 준비
  const lowestPriceMarkerImageUrl = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png'; // 별 모양
  const normalMarkerImageUrl = 'http://t1.daumcdn.net/mapjsapi/marker/2/marker.png'; // 기본 파란색
  const imageSize = new window.kakao.maps.Size(24, 35);
  const lowestPriceMarkerImage = new window.kakao.maps.MarkerImage(lowestPriceMarkerImageUrl, imageSize);
  const normalMarkerImage = new window.kakao.maps.MarkerImage(normalMarkerImageUrl, imageSize);
  visibleStations.value.forEach((visibleStation) => { // 순회 변수 이름 변경 (station -> visibleStation)
    // visibleStation.id를 사용하여 최신 fuelInfo에서 해당 주유소 정보 찾기
    const station = fuelInfo.value.find(f => f.id === visibleStation.id);

    // station 정보가 없거나 좌표가 없으면 건너뛰기
    if (!station || !station.lat || !station.lng) {
        console.warn(`Skipping marker for ID ${visibleStation.id}: Station data or coordinates missing in latest fuelInfo.`);
        return;
    }

    if (station.lat && station.lng) {
      const markerPosition = new window.kakao.maps.LatLng(station.lat, station.lng);

      // 최저가 여부 확인 (최신 station 정보 기준)
      const stationPrices = fuelPrices.value[station.id] || {};
      const price = stationPrices[selectedFuelType.value];
      const isLowest = price === currentMinPrice.value;

      // 마커 이미지 선택
      const markerImage = isLowest ? lowestPriceMarkerImage : normalMarkerImage;

      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        title: station.osnm,
        image: markerImage
      });

      // TODO: 마커 클릭 시 인포윈도우 표시 등의 상호작용 추가 가능
      // 예시: 인포윈도우 생성
      // 가격 정보 가져오기 - 변수명 stationPrices 사용
      // const stationPrices = fuelPrices.value[station.id] || {}; // 이미 위에서 선언됨
      const selectedTypeKey = selectedFuelType.value;
      const selectedPrice = stationPrices[selectedTypeKey]; // stationPrices 사용
      const selectedTypeText = fuelTypes.find(f => f.value === selectedTypeKey)?.text || selectedTypeKey; // 선택된 유종의 한글 이름

      let priceContent = '';
      if (selectedPrice > 0) {
        priceContent = `<div>${selectedTypeText}: ${selectedPrice.toLocaleString()}원</div>`;
      } else {
        priceContent = `<div>${selectedTypeText}: 가격 정보 없음</div>`; // 선택 유종 가격이 0이거나 없을 때
      }

      // 거리 정보 표시 로직 수정 (최신 station 정보 사용)
      let distanceContent = '';
      // console.log(`[InfoWindow] Station ${station.id} (${station.osnm}) - distance value:`, station.distance, typeof station.distance);
      if (typeof station.distance === 'number' && station.distance !== Infinity) {
        const distanceInKm = station.distance / 1000;
        if (distanceInKm < 1) {
          distanceContent = `<div>도로 거리: ${station.distance}m</div>`;
        } else {
          distanceContent = `<div>도로 거리: ${distanceInKm.toFixed(1)}km</div>`;
        }
      } else if (station.distance === Infinity) {
        distanceContent = '<div>(5km 반경 밖)</div>';
      } else if (station.distance === undefined) {
        // 'undefined'는 초기 상태 또는 계산 대상이 아닌 경우일 수 있음
        // 최저가 주유소인데 undefined이면 계산 중, 아니면 표시 안 함 또는 다른 메시지
        if (isLowest) {
            distanceContent = '<div>거리 계산 중...</div>';
        } else {
            distanceContent = ''; // 일반 주유소는 거리 계산 안 하므로 표시 안 함
        }
      } else { // null (API 실패 등)
         if (isLowest) { // 최저가 주유소의 거리 계산 실패 시
            distanceContent = '<div>도로 거리 정보 없음</div>';
         } else {
             distanceContent = ''; // 일반 주유소는 표시 안 함
         }
      }

      // 직선 거리도 표시 (선택 사항)
      let haversineDistanceContent = '';
      if (typeof station.haversineDistance === 'number') {
          const haversineKm = station.haversineDistance / 1000;
          haversineDistanceContent = `<div style="color:grey; font-size:11px;">(직선 ${haversineKm.toFixed(1)}km)</div>`;
      }


      const infowindowContent = `
        <div style="padding:7px;font-size:12px;line-height:1.5;">
          <strong style="font-size:13px;">${station.osnm}</strong><br>
          ${priceContent || '가격 정보 없음'}
          ${distanceContent}
        </div>
      `;

      const infowindow = new window.kakao.maps.InfoWindow({
          content: infowindowContent,
          removable: true
      });

      // 인포윈도우를 마커 위에 바로 표시
      infowindow.open(mapInstance.value, marker);
      newInfowindows.push(infowindow); // 생성된 인포윈도우 저장

      // 이벤트 리스너 제거됨

      marker.setMap(mapInstance.value); // 지도에 마커 표시
      newMarkers.push(marker);
    } else {
      // console.warn(`Skipping marker for ${station.osnm} due to missing coordinates.`);
    }
  });
  markers.value = newMarkers;
  infowindows.value = newInfowindows; // 새로 생성된 인포윈도우들 저장
};

// '현재 지도에서 검색' 함수 수정
const searchInBounds = () => {
  if (!mapInstance.value || !Array.isArray(fuelInfo.value) || fuelInfo.value.length === 0 || Object.keys(fuelPrices.value).length === 0) {
    console.warn("Map, fuel info, or price info not ready for search.");
    return;
  }
  isSearching.value = true;
  console.log("Searching in current map bounds...");

  const bounds = mapInstance.value.getBounds();

  // 1. 현재 지도 범위 내 & 유효한 가격 정보가 있는 주유소 필터링
  stationsInBounds.value = fuelInfo.value.filter(station => {
    if (!station.lat || !station.lng) return false;
    const position = new window.kakao.maps.LatLng(station.lat, station.lng);
    const prices = fuelPrices.value[station.id];
    // 범위 안에 있고, 가격 정보가 있으며, 선택된 유종 가격이 0보다 큰 경우
    return bounds.contain(position) && prices && prices[selectedFuelType.value] > 0;
  });
  console.log(`Found ${stationsInBounds.value.length} stations with valid price for ${selectedFuelType.value} within bounds.`);

  if (stationsInBounds.value.length === 0) {
    lowestPriceStations.value = [];
    otherStationsInBounds.value = [];
    currentMinPrice.value = Infinity;
  } else {
    // 2. 최저가 계산
    currentMinPrice.value = stationsInBounds.value.reduce((min, station) => {
      const price = fuelPrices.value[station.id][selectedFuelType.value];
      return price < min ? price : min;
    }, Infinity);
    console.log(`Lowest price for ${selectedFuelType.value} in bounds: ${currentMinPrice.value}`);

    // 3. 최저가 그룹 분리
    const allLowestStations = stationsInBounds.value.filter(station => {
      const price = fuelPrices.value[station.id][selectedFuelType.value];
      return price === currentMinPrice.value;
    });

    // 3.1. 최저가 그룹을 지도 중심 기준 직선 거리순 정렬
    const mapCenter = mapInstance.value.getCenter();
    const centerLat = mapCenter.getLat();
    const centerLng = mapCenter.getLng();

    allLowestStations.sort((a, b) => {
        const distA = calculateDistance(centerLat, centerLng, a.lat, a.lng);
        const distB = calculateDistance(centerLat, centerLng, b.lat, b.lng);
        return distA - distB;
    });
    lowestPriceStations.value = allLowestStations; // 정렬된 배열 할당

    // 3.2. 그 외 그룹 분리
    otherStationsInBounds.value = stationsInBounds.value.filter(station => {
      const price = fuelPrices.value[station.id][selectedFuelType.value];
      return price > currentMinPrice.value;
    });

    // 4. 그 외 그룹 가격순 정렬
    otherStationsInBounds.value.sort((a, b) => {
      const priceA = fuelPrices.value[a.id][selectedFuelType.value];
      const priceB = fuelPrices.value[b.id][selectedFuelType.value];
      return priceA - priceB;
    });

    console.log(`Lowest price stations: ${lowestPriceStations.value.length}, Other stations: ${otherStationsInBounds.value.length}`);
  }

  // 5. 표시할 주유소 개수 초기화 및 업데이트
  visibleCount.value = INITIAL_VISIBLE_COUNT;
  updateVisibleStations(); // 마커 표시

  // 6. 최저가 주유소 거리 계산 시작 (사용자 위치가 있을 경우)
  if (userLocation.value && lowestPriceStations.value.length > 0) {
    console.log("Calculating distances for lowest price stations...");
    // 비동기 호출, 완료 기다리지 않음 (UI 업데이트는 fuelInfo watch가 처리)
    calculateDistances(lowestPriceStations.value, userLocation.value);
  } else if (!userLocation.value) {
      console.warn("Skipping distance calculation: User location not available.");
  }

  isSearching.value = false;
};

// 표시할 주유소 목록 업데이트 및 마커 표시 함수 수정
const updateVisibleStations = () => {
  const lowestToShow = lowestPriceStations.value.slice(0, visibleCount.value);
  let remainingCount = visibleCount.value - lowestToShow.length;
  let othersToShow = [];

  if (remainingCount > 0) {
    othersToShow = otherStationsInBounds.value.slice(0, remainingCount);
  }

  visibleStations.value = [...lowestToShow, ...othersToShow];
  console.log(`Updating visible stations: ${visibleStations.value.length} (Lowest: ${lowestToShow.length}, Others: ${othersToShow.length})`);
  displayMarkers();
};

// '더 보기' 함수
const loadMore = () => {
  visibleCount.value += LOAD_MORE_COUNT;
  updateVisibleStations();
};


onMounted(async () => {
  // console.log("FuelList component mounted."); // 필요시 주석 해제
  // console.log("--- Starting onMounted ---"); // 필요시 주석 해제

  // 1. 현재 위치 가져오기 시도
  // console.log("Step 1: Attempting to get current location..."); // 필요시 주석 해제
  let initialCenter = { lat: 33.4996, lng: 126.5312 }; // 기본값: 제주 시청
  const fetchedLocation = await getCurrentLocationAsync();
  if (fetchedLocation) {
    initialCenter = fetchedLocation;
    userLocation.value = fetchedLocation; // 사용자 위치 저장
    // console.log("Using current location as initial center."); // 필요시 주석 해제
  } else {
    userLocation.value = null; // 위치 가져오기 실패
    // console.log("Failed to get current location, using default center."); // 필요시 주석 해제
  }

  // 2. 카카오맵 로드 및 초기화 (현재 위치 또는 기본 위치 사용)
  // console.log("Step 2: Loading Kakao Map..."); // 필요시 주석 해제
  try {
    if (!window.kakao || !window.kakao.maps) {
      await loadKakaoMapScript();
      // console.log("Kakao Maps SDK loaded successfully."); // 필요시 주석 해제
    } else {
      // console.log("Kakao Maps SDK already loaded."); // 필요시 주석 해제
    }

    // DOM 업데이트를 기다린 후 지도 초기화
    await nextTick();

    // console.log("DOM ready, initializing map with center:", initialCenter); // 필요시 주석 해제
    const { mapInstance: initializedMap, error: mapError } = initMap('map', initialCenter, 5); // 가져온 위치로 초기화
    if (mapError) {
      console.error("Error initializing map inside nextTick:", mapError);
      throw new Error(mapError);
    }
    if (!initializedMap || !initializedMap.value) {
        console.error("initMap did not return a valid map instance.");
        throw new Error("Failed to get map instance from initMap.");
    }
    mapInstance.value = initializedMap.value;
    // console.log("Map initialized successfully after nextTick."); // 필요시 주석 해제

    // 현재 위치 마커 표시 (성공 여부와 관계없이 시도, 함수 내부에서 처리)
    displayCurrentLocation(mapInstance);

    // 3. 주유소 정보 로드
    await getFuelData();

    // 4. 지도 및 데이터 준비 완료 후 초기 검색 및 거리 계산 실행
    if (mapInstance.value && Array.isArray(fuelInfo.value) && fuelInfo.value.length > 0 && Object.keys(fuelPrices.value).length > 0) {
        console.log("Map and initial data ready. Performing initial search and distance calculation...");
        searchInBounds(); // 초기 검색 실행 (내부에서 거리 계산 호출)
    } else {
        console.warn("Initial search skipped. Map or data not ready.");
    }

    // 5. 지도 idle 이벤트 리스너 등록 (선택적)
    // ... (이전과 동일)

  } catch (error) {
    console.error('Error during component mount:', error);
    const mapDiv = document.getElementById('map');
    if (mapDiv) {
      mapDiv.innerHTML = '지도 또는 데이터를 불러오는 중 오류가 발생했습니다.';
      // 스타일링은 CSS 클래스로 관리하는 것이 더 좋음
    }
  }
});

// selectedFuelType 변경 시 자동으로 재검색
watch(selectedFuelType, () => {
  console.log(`Fuel type changed to: ${selectedFuelType.value}`);
  // 이전에 검색된 결과가 있을 경우(stationsInBounds 사용) 자동 재검색
  if (stationsInBounds.value.length > 0) {
      searchInBounds(); // searchInBounds 내부에서 거리 계산 호출
  }
});

// 사용자 위치 변경 시 거리 재계산
watch(userLocation, (newLocation) => {
    if (newLocation && lowestPriceStations.value.length > 0 && !isCalculatingDistances.value) {
        console.log("User location changed. Recalculating distances for lowest price stations...");
        calculateDistances(lowestPriceStations.value, newLocation);
    }
}, { deep: true }); // 객체 내부 변경 감지


// fuelInfo 변경 감지 (거리 계산 완료 후 마커 업데이트 트리거) + 로그 추가
watch(fuelInfo, (newFuelInfo, oldFuelInfo) => {
    // 변경된 주유소만 필터링하여 로그 출력 (옵션)
    const changedStations = newFuelInfo.filter((newItem, index) => {
        const oldItem = oldFuelInfo ? oldFuelInfo[index] : null;
        // distance 값이 변경되었는지 확인 (undefined -> number/null 또는 number -> number/null)
        return oldItem ? newItem.distance !== oldItem.distance : newItem.distance !== undefined;
    });
    if (changedStations.length > 0) {
        console.log(`[Watch fuelInfo] Detected changes in ${changedStations.length} stations. Example change:`, JSON.parse(JSON.stringify(changedStations[0])));
    } else {
        console.log("[Watch fuelInfo] fuelInfo changed, but no distance updates detected or oldFuelInfo not available.");
    }

    console.log("[Watch fuelInfo] Updating markers due to fuelInfo change...");
    // visibleStations 목록을 최신 상태 기준으로 다시 계산하고 마커를 그림
    updateVisibleStations();

}, { deep: true });

// isLoading 상태 변경 시 지도 표시/숨김 처리 (CSS 클래스 사용)
// error 상태 변경 시 메시지 표시 (템플릿에서 처리)

</script>

<style scoped>
.fuel-type-selector {
  position: absolute; /* map-wrapper 기준 */
  top: 10px;
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

/* '현재 지도에서 검색' 버튼 스타일 */
.search-button-container {
  position: absolute;
  top: 60px; /* 유가 선택기 아래 */
  left: 50%;
  transform: translateX(-50%);
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

/* 기존 .toggle-btn 스타일 제거 */

/* 기존 .toggle-btn 스타일 제거 */

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
