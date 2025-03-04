<template>
  <div class="fuel-list-map">
    <div id="list-kakao-map" class="map-container"></div>
    <div v-if="loading" class="map-loading">
      <p>지도를 불러오는 중...</p>
    </div>
    <UserLocationDisplay :location="userLocation" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, defineProps, defineExpose, defineEmits } from 'vue';
import { initKakaoMap } from '@/api/kakaoMapApi';
import { getCoordinatesByAddress } from '@/modules/fuel/api/kakaoMapService';
import { getBrandName } from '@/modules/fuel/utils/brandUtils';
import { getPriceColor, isLowestPrice } from '@/modules/fuel/utils/colorUtils';
import { calculateHaversineDistance, formatDistance, getCurrentLocation } from '@/modules/fuel/api/kakaoMobilityService';
import UserLocationDisplay from '@/modules/components/common/UserLocationDisplay.vue';

const props = defineProps({
  fuelStations: {
    type: Array,
    default: () => []
  },
  selectedArea: {
    type: String,
    default: '11' // 기본값: 제주
  },
  selectedStationId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['select-station']);

// 상태 관리
const map = ref(null);
const markers = ref([]);
const loading = ref(true);
const defaultCenter = ref({ lat: 33.5113, lng: 126.5292 }); // 제주 기본 좌표
const currentCenter = ref({ ...defaultCenter.value });
const markerMap = ref({}); // 주유소 ID와 마커를 매핑하는 객체
const userLocationMarker = ref(null);
const userLocation = ref(null); // 사용자 위치 정보 저장

// 마커 제거 함수
const clearMarkers = () => {
  // 모든 마커 제거
  markers.value.forEach(marker => {
    // 마커에 연결된 인포윈도우가 있으면 닫기
    if (marker.infoWindow) {
      marker.infoWindow.close();
      marker.infoWindow = null;
    }
    marker.setMap(null);
  });
  
  // 가격 오버레이 제거
  Object.values(markerMap.value).forEach(item => {
    if (item.priceOverlay) {
      item.priceOverlay.setMap(null);
    }
  });
  
  // 배열 초기화
  markers.value = [];
  markerMap.value = {};
};

// 가격 기반 마커 이미지 생성 함수
const createMarkerImage = (station, allStations, index) => {
  // 가격 레벨에 따른 색상 결정
  const color = getPriceColor(parseFloat(station.PRICE), allStations);
  
  // 최저가 주유소 확인
  const isLowestPriceStation = isLowestPrice(station.PRICE, allStations);
  
  // SVG 마커 생성 (최저가일 경우 별표 추가)
  const svgMarker = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="35" viewBox="0 0 24 35">
      <path fill="${color}" d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 23 12 23s12-15.8 12-23c0-6.6-5.4-12-12-12z"/>
      <circle fill="white" cx="12" cy="12" r="5"/>
      ${isLowestPriceStation ? `
        <path fill="gold" d="M12 5.5l1.5 3 3.5 0.5-2.5 2.5 0.5 3.5-3-1.5-3 1.5 0.5-3.5-2.5-2.5 3.5-0.5z"/>
      ` : ''}
    </svg>
  `;
  
  // SVG를 Base64로 인코딩
  const encodedSvg = window.btoa(svgMarker);
  
  // 마커 이미지 생성
  return new window.kakao.maps.MarkerImage(
    'data:image/svg+xml;base64,' + encodedSvg,
    new window.kakao.maps.Size(24, 35),
    { offset: new window.kakao.maps.Point(12, 35) }
  );
};

// 마커 생성 함수
const createMarkers = async () => {
  // 기존 마커 제거
  markers.value.forEach(marker => marker.setMap(null));
  
  // 기존 가격 오버레이 제거
  Object.values(markerMap.value).forEach(item => {
    if (item.priceOverlay) {
      item.priceOverlay.setMap(null);
    }
  });
  
  markers.value = [];
  markerMap.value = {};
  
  // 사용자 위치 표시
  const userLocation = await showUserLocation();
  
  if (!props.fuelStations || props.fuelStations.length === 0) return;
  
  // 모든 주유소에 대해 마커 생성
  const bounds = new window.kakao.maps.LatLngBounds();
  
  // 사용자 위치가 있으면 바운드에 추가
  if (userLocation) {
    bounds.extend(new window.kakao.maps.LatLng(userLocation.latitude, userLocation.longitude));
  }
  
  // 각 주유소에 대한 마커 생성
  for (const [index, station] of props.fuelStations.entries()) {
    try {
      // 주소로 좌표 변환
      const address = station.NEW_ADR || station.VAN_ADR;
      if (!address) continue;
      
      // 카카오 API로 주소를 좌표로 변환
      const coords = await getCoordinatesByAddress(address);
      if (!coords) continue;
      
      // 마커 위치 생성
      const position = new window.kakao.maps.LatLng(coords.lat, coords.lng);
      
      // 마커 이미지 생성
      const markerImage = createMarkerImage(station, props.fuelStations, index);
      
      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        map: map.value,
        position: position,
        image: markerImage,
        title: station.OS_NM,
        zIndex: isLowestPrice(station.PRICE, props.fuelStations) ? 2 : 1
      });
      
      // 가격 표시 커스텀 오버레이 생성
      const priceContent = `
        <div class="price-overlay ${isLowestPrice(station.PRICE, props.fuelStations) ? 'lowest-price' : ''}">
          ${formatPrice(station.PRICE)}원
        </div>
      `;
      
      const priceOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: priceContent,
        yAnchor: 1.5,
        zIndex: 3
      });
      
      // 커스텀 오버레이를 지도에 표시
      priceOverlay.setMap(map.value);
      
      // 거리 계산 (사용자 위치가 있는 경우)
      let distanceText = '';
      if (userLocation) {
        // 하버사인 공식으로 직선 거리 계산 (km)
        const distanceInKm = calculateHaversineDistance(
          userLocation.latitude,
          userLocation.longitude,
          coords.lat,
          coords.lng
        );
        
        // 미터 단위로 변환
        const distanceInMeters = distanceInKm * 1000;
        
        // 거리 포맷팅
        distanceText = formatDistance(distanceInMeters);
      }
      
      // 최저가 여부 확인
      const isLowestPriceStation = isLowestPrice(station.PRICE, props.fuelStations);
      
      // 인포윈도우 내용 생성
      const infoContent = `
        <div class="map-info-window">
          <h3>${station.OS_NM} ${isLowestPriceStation ? '<span class="lowest-price-badge">최저가</span>' : ''}</h3>
          <p><strong>브랜드:</strong> ${getBrandName(station.POLL_DIV_CD)}</p>
          <p><strong>가격:</strong> <span class="price-value">${formatPrice(station.PRICE)}원</span></p>
          <p><strong>주소:</strong> ${address}</p>
          ${distanceText ? `<p><strong>거리:</strong> ${distanceText}</p>` : ''}
        </div>
      `;
      
      // 마커 맵에 추가 (ID로 접근 가능하도록)
      markerMap.value[station.UNI_ID] = {
        marker,
        coords,
        infoContent,
        priceOverlay
      };
      
      // 마커에 마우스 올렸을 때 이벤트
      window.kakao.maps.event.addListener(marker, 'mouseover', function() {
        // 다른 인포윈도우 모두 닫기
        closeAllInfoWindows();
        
        // 현재 마커에 인포윈도우 열기
        const infoWindow = new window.kakao.maps.InfoWindow({
          content: markerMap.value[station.UNI_ID].infoContent,
          removable: false
        });
        
        infoWindow.open(map.value, marker);
        marker.infoWindow = infoWindow;
      });
      
      // 마커에서 마우스가 벗어났을 때 이벤트
      window.kakao.maps.event.addListener(marker, 'mouseout', function() {
        // 선택된 주유소가 아니면 인포윈도우 닫기
        if (props.selectedStationId !== station.UNI_ID) {
          if (marker.infoWindow) {
            marker.infoWindow.close();
            marker.infoWindow = null;
          }
        }
      });
      
      // 마커 클릭 이벤트 처리
      window.kakao.maps.event.addListener(marker, 'click', function() {
        // 선택한 주유소 ID 이벤트 발생
        emit('select-station', station.UNI_ID);
      });
      
      // 마커 배열에 추가
      markers.value.push(marker);
      
      // 바운드에 위치 추가
      bounds.extend(position);
    } catch (error) {
      console.error(`주유소 마커 생성 중 오류 (${station.OS_NM}):`, error);
    }
  }
  
  // 모든 마커를 바운드에 추가
  markers.value.forEach(marker => {
    bounds.extend(marker.getPosition());
  });
  
  // 바운드에 맞게 지도 중심 및 레벨 조정
  map.value.setBounds(bounds);
};

// 모든 인포윈도우 닫기 함수
const closeAllInfoWindows = () => {
  // 모든 마커의 인포윈도우 닫기
  markers.value.forEach(marker => {
    if (marker.infoWindow) {
      marker.infoWindow.close();
      marker.infoWindow = null;
    }
  });
};

// 사용자 현재 위치 가져오기 및 표시
const showUserLocation = async () => {
  try {
    // 브라우저 위치 정보 가져오기
    const position = await getCurrentLocation();
    
    const { latitude, longitude } = position;
    
    // 사용자 위치 정보 저장
    userLocation.value = { latitude, longitude };
    
    // 사용자 위치 마커 이미지 생성
    const markerImage = new window.kakao.maps.MarkerImage(
      'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
      new window.kakao.maps.Size(24, 35),
      { offset: new window.kakao.maps.Point(12, 35) }
    );
    
    // 사용자 위치 마커 생성
    const userMarker = new window.kakao.maps.Marker({
      map: map.value,
      position: new window.kakao.maps.LatLng(latitude, longitude),
      image: markerImage,
      zIndex: 3, // 다른 마커보다 위에 표시
      title: '내 위치'
    });
    
    // 사용자 위치 인포윈도우 생성
    const infoContent = `
      <div class="map-info-window user-location">
        <h3>내 위치</h3>
        <p><strong>좌표:</strong> ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</p>
      </div>
    `;
    
    // 마커에 마우스 올렸을 때 이벤트
    window.kakao.maps.event.addListener(userMarker, 'mouseover', function() {
      // 다른 인포윈도우 모두 닫기
      closeAllInfoWindows();
      
      // 현재 마커에 인포윈도우 열기
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: infoContent,
        removable: false
      });
      
      infoWindow.open(map.value, userMarker);
      userMarker.infoWindow = infoWindow;
    });
    
    // 마커에서 마우스가 벗어났을 때 이벤트
    window.kakao.maps.event.addListener(userMarker, 'mouseout', function() {
      if (userMarker.infoWindow) {
        userMarker.infoWindow.close();
        userMarker.infoWindow = null;
      }
    });
    
    // 마커 클릭 이벤트 처리
    window.kakao.maps.event.addListener(userMarker, 'click', function() {
      // 다른 인포윈도우 모두 닫기
      closeAllInfoWindows();
      
      // 인포윈도우 생성 및 표시
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: infoContent,
        removable: false
      });
      
      infoWindow.open(map.value, userMarker);
      userMarker.infoWindow = infoWindow;
    });
    
    // 사용자 위치 마커 배열에 추가
    markers.value.push(userMarker);
    
    return position;
  } catch (error) {
    console.error('사용자 위치를 가져오는 중 오류 발생:', error);
    return null;
  }
};

// 특정 주유소로 지도 이동
const moveToStation = (stationId) => {
  if (!map.value || !markerMap.value[stationId]) return;
  
  const { marker, coords } = markerMap.value[stationId];
  
  // 지도 중심 이동
  map.value.setCenter(new window.kakao.maps.LatLng(coords.lat, coords.lng));
  map.value.setLevel(3); // 줌 레벨 설정
  
  // 다른 인포윈도우 모두 닫기
  closeAllInfoWindows();
  
  // 해당 마커의 인포윈도우 열기
  const infoWindow = new window.kakao.maps.InfoWindow({
    content: markerMap.value[stationId].infoContent,
    removable: false
  });
  
  marker.infoWindow = infoWindow;
  infoWindow.open(map.value, marker);
  
  // 마커 애니메이션 효과 (바운스)
  marker.setAnimation(window.kakao.maps.Animation.BOUNCE);
  
  // 1초 후 애니메이션 중지
  setTimeout(() => {
    marker.setAnimation(null);
  }, 1000);
};

// 지역 코드별 중심 좌표 (대략적인 위치)
const getAreaCenter = (areaCode) => {
  const areaCenters = {
    '01': { lat: 37.5665, lng: 126.9780 }, // 서울
    '02': { lat: 37.4138, lng: 127.5183 }, // 경기
    '03': { lat: 37.8228, lng: 128.1555 }, // 강원
    '04': { lat: 36.6357, lng: 127.4914 }, // 충북
    '05': { lat: 36.6588, lng: 126.6728 }, // 충남
    '06': { lat: 35.8242, lng: 127.1489 }, // 전북
    '07': { lat: 34.8679, lng: 126.9910 }, // 전남
    '08': { lat: 36.5760, lng: 128.5050 }, // 경북
    '09': { lat: 35.4606, lng: 128.2132 }, // 경남
    '10': { lat: 35.1796, lng: 129.0756 }, // 부산
    '11': { lat: 33.5113, lng: 126.5292 }, // 제주
    '14': { lat: 35.8714, lng: 128.6014 }, // 대구
    '15': { lat: 37.4563, lng: 126.7052 }, // 인천
    '16': { lat: 35.1595, lng: 126.8526 }, // 광주
    '17': { lat: 36.3504, lng: 127.3845 }, // 대전
    '18': { lat: 35.5384, lng: 129.3114 }, // 울산
    '19': { lat: 36.4800, lng: 127.2890 }  // 세종
  };
  
  return areaCenters[areaCode] || defaultCenter.value;
};

// 가격 포맷팅 함수
const formatPrice = (price) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// 지도 초기화
const initializeMap = async () => {
  try {
    loading.value = true;
    
    // 카카오맵 SDK 초기화
    await initKakaoMap();
    
    // 지도 컨테이너 확인
    const container = document.getElementById('list-kakao-map');
    if (!container) {
      console.warn('지도를 표시할 DOM 요소를 찾을 수 없습니다.');
      loading.value = false;
      return;
    }
    
    // 지역 코드에 따른 중심 좌표 설정
    currentCenter.value = getAreaCenter(props.selectedArea);
    
    // 지도 옵션 설정
    const options = {
      center: new window.kakao.maps.LatLng(currentCenter.value.lat, currentCenter.value.lng),
      level: 9 // 초기 줌 레벨
    };
    
    // 지도 생성
    map.value = new window.kakao.maps.Map(container, options);
    
    // 마커 생성
    await createMarkers();
    
    loading.value = false;
  } catch (error) {
    console.error('지도 초기화 중 오류 발생:', error);
    loading.value = false;
  }
};

// 지역 변경 시 지도 중심 변경
watch(() => props.selectedArea, async (newArea) => {
  if (!map.value) return;
  
  // 새 지역의 중심 좌표 가져오기
  const newCenter = getAreaCenter(newArea);
  currentCenter.value = newCenter;
  
  // 지도 중심 이동
  map.value.setCenter(new window.kakao.maps.LatLng(newCenter.lat, newCenter.lng));
  map.value.setLevel(9); // 줌 레벨 재설정
});

// 주유소 목록 변경 시 마커 업데이트
watch(() => props.fuelStations, async () => {
  if (map.value) {
    await createMarkers();
  }
}, { deep: true });

// 선택된 주유소 ID 변경 시 해당 주유소로 지도 이동
const handleSelectStation = (stationId) => {
  if (!stationId || !markerMap.value[stationId]) return;
  
  // 선택된 주유소 정보 가져오기
  const { marker, coords } = markerMap.value[stationId];
  
  // 모든 인포윈도우 닫기
  closeAllInfoWindows();
  
  // 모든 가격 오버레이 스타일 초기화
  Object.values(markerMap.value).forEach(item => {
    if (item.priceOverlay) {
      const overlayElement = item.priceOverlay.getContent();
      if (overlayElement instanceof Element) {
        overlayElement.querySelector('.price-overlay')?.classList.remove('selected');
      } else if (typeof overlayElement === 'string') {
        // 문자열인 경우 새로운 콘텐츠로 교체
        const priceDiv = overlayElement.replace('selected', '');
        item.priceOverlay.setContent(priceDiv);
      }
    }
  });
  
  // 선택된 주유소의 가격 오버레이 스타일 변경
  if (markerMap.value[stationId].priceOverlay) {
    const overlayElement = markerMap.value[stationId].priceOverlay.getContent();
    if (typeof overlayElement === 'string') {
      // HTML 문자열에서 class 추가
      const newContent = overlayElement.replace('price-overlay', 'price-overlay selected');
      markerMap.value[stationId].priceOverlay.setContent(newContent);
    }
  }
  
  // 인포윈도우 생성 및 표시
  const infoWindow = new window.kakao.maps.InfoWindow({
    content: markerMap.value[stationId].infoContent,
    removable: false
  });
  
  infoWindow.open(map.value, marker);
  marker.infoWindow = infoWindow;
  
  // 지도 중심 이동
  const position = new window.kakao.maps.LatLng(coords.lat, coords.lng);
  map.value.setCenter(position);
  
  // 지도 확대 레벨 설정
  map.value.setLevel(3);
};

watch(() => props.selectedStationId, (newStationId) => {
  if (newStationId && markerMap.value[newStationId]) {
    handleSelectStation(newStationId);
  } else {
    // 선택 해제 시 모든 인포윈도우 닫기
    closeAllInfoWindows();
    
    // 모든 가격 오버레이 스타일 초기화
    Object.values(markerMap.value).forEach(item => {
      if (item.priceOverlay) {
        const overlayElement = item.priceOverlay.getContent();
        if (typeof overlayElement === 'string') {
          const priceDiv = overlayElement.replace('selected', '');
          item.priceOverlay.setContent(priceDiv);
        }
      }
    });
  }
});

// 컴포넌트가 마운트될 때 지도 초기화
onMounted(() => {
  initializeMap();
});

// 컴포넌트가 언마운트될 때 정리
onUnmounted(() => {
  // 마커 제거
  markers.value.forEach(marker => marker.setMap(null));
  
  // 인포윈도우 닫기
  closeAllInfoWindows();
  
  // 가격 오버레이 제거
  Object.values(markerMap.value).forEach(item => {
    if (item.priceOverlay) {
      item.priceOverlay.setMap(null);
    }
  });
  
  // 지도 이벤트 리스너 제거
  if (map.value) {
    window.kakao.maps.event.removeListener(map.value, 'click', handleMapClick);
  }
  
  map.value = null;
});

// 외부에서 접근할 수 있는 메서드 노출
defineExpose({
  moveToStation
});
</script>

<style scoped>
.fuel-list-map {
  width: 100%;
  height: 500px;
  position: relative;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-container {
  width: 100%;
  height: 100%;
}

.map-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

/* 인포윈도우 스타일 - 전역으로 적용되도록 :global 사용 */
:global(.map-info-window) {
  padding: 10px;
  min-width: 200px;
  max-width: 300px;
  font-family: 'Noto Sans KR', sans-serif;
}

:global(.map-info-window h3) {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

:global(.map-info-window p) {
  margin: 4px 0;
  font-size: 14px;
  color: #333;
}

:global(.lowest-price-badge) {
  background-color: gold;
  color: #333;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
  font-weight: normal;
}

:global(.price-value) {
  font-weight: bold;
  color: #333;
}

:global(.user-location h3) {
  color: #3498db;
}

:global(.user-location) {
  background-color: #f8f9fa;
  border-left: 3px solid #3498db;
}

.price-overlay {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 13px;
  font-weight: bold;
  color: #333;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 2px 4px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  border: 1px solid #ddd;
  white-space: nowrap;
  text-align: center;
}

.price-overlay.lowest-price {
  background-color: rgba(255, 248, 220, 0.95);
  color: #d35400;
  border-color: #f39c12;
  font-weight: 900;
}

.price-overlay.selected {
  background-color: rgba(52, 152, 219, 0.95);
  color: white;
  border-color: #2980b9;
  font-weight: 900;
  transform: translate(-50%, -50%) scale(1.2);
  z-index: 10;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}
</style>
