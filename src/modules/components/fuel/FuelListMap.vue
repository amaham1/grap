<template>
  <div class="fuel-list-map">
    <div id="list-kakao-map" class="map-container"></div>
    <div v-if="loading" class="map-loading">
      <p>지도를 불러오는 중...</p>
    </div>
    <div class="map-controls">
      <button @click="toggleDrawMode" :class="{ active: isDrawMode }">
        {{ isDrawMode ? '그리기 취소' : '선 그리기' }}
      </button>
      <button v-if="line" @click="divideLine">선 분할하기</button>
      <button v-if="line" @click="clearLine">선 지우기</button>
      <div v-if="line" class="radius-control">
        <label>검색 반경: {{ searchRadius }}km</label>
        <input 
          type="range" 
          v-model="searchRadius" 
          min="1" 
          max="5" 
          step="0.5"
        >
      </div>
      <div class="fuel-type-filter">
        <label>유류 종류:</label>
        <select v-model="selectedFuelType" @change="changeFuelType">
          <option value="gasoline">휘발유</option>
          <option value="premium_gasoline">고급유</option>
          <option value="diesel">경유</option>
          <option value="lpg">LPG</option>
        </select>
      </div>
    </div>
    <div v-if="dividePoints.length > 0" class="divide-points">
      <h3>분할 지점 좌표 및 주변 주유소</h3>
      <div class="points-list">
        <div v-for="(point, index) in dividePoints" :key="index" class="point-item">
          <div class="point-header">
            <span>지점 {{ index + 1 }}:</span>
            <span>위도: {{ point.lat.toFixed(6) }}, 경도: {{ point.lng.toFixed(6) }}</span>
          </div>
          <div v-if="pointStations[index]" class="station-list">
            <div v-if="pointStations[index].loading">검색 중...</div>
            <div v-else-if="pointStations[index].error">{{ pointStations[index].error }}</div>
            <div v-else>
              <div v-for="station in pointStations[index].stations" :key="station.UNI_ID" class="station-item">
                <div class="station-name" @click="moveToStation(station)" style="cursor: pointer;">{{ station.OS_NM }}</div>
                <div class="station-info">
                  <span>가격: {{ station.PRICE }}원</span>
                  <span>거리: {{ (station.DISTANCE / 1000).toFixed(2) }}km</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <UserLocationDisplay :location="userLocation" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, defineProps, defineEmits } from 'vue';
import { fetchFuelStationDetail } from '@/modules/fuel/api/fuelService';
import { initKakaoMap } from '@/api/kakaoMapApi';
import { isLowestPrice } from '@/modules/fuel/utils/colorUtils';
import { getCurrentLocation } from '@/modules/fuel/api/kakaoMobilityService';
import { convertKatecToWGS84 } from '@/modules/fuel/utils/coordinateUtils';
import { divideLineIntoPoints } from '@/modules/fuel/utils/coordinateUtils';
import UserLocationDisplay from '@/modules/components/common/UserLocationDisplay.vue';
import { useGasStationFinder } from '@/modules/fuel/utils/coordinateUtils';
import axios from 'axios';

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
const userLocationMarker = ref(null);
const activeInfoWindow = ref(null);
const stationDetails = ref(new Map());
const activeMarker = ref(null); // 현재 활성화된 마커
const defaultMarkerImage = ref(null); // 기본 마커 이미지
const selectedMarkerImage = ref(null); // 선택된 마커 이미지
const infoWindows = ref([]); // 모든 인포윈도우를 추적하는 배열
const markerMap = ref({});
const stationMarkers = ref([]);
const divideMarkers = ref([]);
const startPoint = ref(null);
const endPoint = ref(null);
const polyline = ref(null);
const dividePoints = ref([]);
const pointStations = ref([]);
const selectedStationId = ref(null);
const selectedFuelType = ref('gasoline'); // 기본값: 휘발유

// 사용자 위치 정보
const userLocation = ref(null);

// 선 그리기 관련 상태
const isDrawMode = ref(false);
const line = ref(null);
const startMarker = ref(null);
const endMarker = ref(null);
const searchRadius = ref(1); // 기본 검색 반경 1km

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

// 마커 이미지 생성 함수
const createMarkerImage = (station, stations, index) => {
  // 최저가 주유소 확인
  const isLowestPriceStation = checkIfLowestPrice(station, stations);
  
  // SVG 마커 생성 (최저가일 경우 다른 모양으로 표시)
  let svgMarker;
  
  if (isLowestPriceStation) {
    // 최저가 주유소 마커 (빨간색 계열)
    svgMarker = `
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="32" viewBox="0 0 36 48">
        <path fill="#FF5722" d="M18 0C8.1 0 0 8.1 0 18c0 10.8 18 30 18 30s18-19.2 18-30c0-9.9-8.1-18-18-18z"/>
        <circle fill="white" cx="18" cy="18" r="8"/>
        <text x="18" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#FF5722">$</text>
      </svg>
    `;
  } else {
    // 일반 주유소 마커 (파란색 계열)
    svgMarker = `
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="32" viewBox="0 0 36 48">
        <path fill="#2196F3" d="M18 0C8.1 0 0 8.1 0 18c0 10.8 18 30 18 30s18-19.2 18-30c0-9.9-8.1-18-18-18z"/>
        <circle fill="white" cx="18" cy="18" r="8"/>
        <text x="18" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#2196F3">P</text>
      </svg>
    `;
  }
  
  // SVG를 Base64로 인코딩
  const encodedSvg = window.btoa(svgMarker);
  
  // 마커 이미지 생성
  return new window.kakao.maps.MarkerImage(
    'data:image/svg+xml;base64,' + encodedSvg,
    new window.kakao.maps.Size(22, 32),
    { offset: new window.kakao.maps.Point(11, 32) }
  );
};

// 최저가 주유소 확인 함수
const checkIfLowestPrice = (station, stations) => {
  if (!station.fuelPrices || !stations || !stations.length) return false;
  
  // 휘발유 가격이 있는 주유소만 필터링
  const stationsWithGasoline = stations.filter(s => 
    s.fuelPrices && 
    s.fuelPrices.gasoline && 
    s.fuelPrices.gasoline > 0
  );
  
  // 휘발유 가격이 있는 주유소가 없으면 false 반환
  if (!stationsWithGasoline.length) return false;
  
  // 최저 휘발유 가격 찾기
  const lowestGasolinePrice = Math.min(
    ...stationsWithGasoline.map(s => s.fuelPrices.gasoline)
  );
  
  // 현재 주유소가 최저가인지 확인
  return station.fuelPrices.gasoline === lowestGasolinePrice;
};

// 주유소 마커 이미지 생성 함수
const createStationMarkerImage = () => {
  const svgMarker = `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="32" viewBox="0 0 36 48">
      <path fill="#4169E1" d="M18 0C8.1 0 0 8.1 0 18c0 10.8 18 30 18 30s18-19.2 18-30c0-9.9-8.1-18-18-18z"/>
      <circle fill="white" cx="18" cy="18" r="8"/>
      <path fill="#4169E1" d="M22 18c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4 1.8-4 4-4z"/>
    </svg>
  `;
  
  const encodedSvg = window.btoa(svgMarker);
  
  return new window.kakao.maps.MarkerImage(
    'data:image/svg+xml;base64,' + encodedSvg,
    new window.kakao.maps.Size(22, 32),
    { offset: new window.kakao.maps.Point(11, 32) }
  );
};

// 선택된 주유소 마커 이미지 생성
const createSelectedStationMarkerImage = () => {
  const imageSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg width="24" height="34" viewBox="0 0 24 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.383 0 0 5.383 0 12c0 9 12 22 12 22s12-13 12-22c0-6.617-5.383-12-12-12z" fill="#FF6B6B"/>
      <circle cx="12" cy="12" r="6" fill="white"/>
    </svg>
  `)}`;

  return new window.kakao.maps.MarkerImage(
    imageSrc,
    new window.kakao.maps.Size(24, 34),
    { offset: new window.kakao.maps.Point(12, 34) }
  );
};

// 마커 생성 함수
const fnCreateStationMarkers = async () => {
  // 기존 마커 제거
  clearMarkers();
  
  if (!props.fuelStations || props.fuelStations.length === 0) return;
  
  // 모든 주유소에 대해 마커 생성
  const bounds = new window.kakao.maps.LatLngBounds();
  
  // 사용자 위치가 있으면 바운드에 추가
  if (userLocation.value) {
    bounds.extend(new window.kakao.maps.LatLng(userLocation.value.latitude, userLocation.value.longitude));
  }
  
  // 주유소 마커 생성 함수 호출
  await createStationMarkers(props.fuelStations, bounds);
};

//카카오맵 주유소 마커 생성 함수 (모듈화)
const createStationMarkers = async (stations) => {
  if (!stations || !stations.length) {
    console.log('주유소 데이터가 없습니다.');
    return [];
  }

  try {
    // 연료 가격 정보 가져오기
    const fuelPrices = await fetchFuelPrices(stations.map(station => station.id));
    // 주유소 ID별 연료 가격 매핑
    const fuelPriceMap = {};
    if (fuelPrices && fuelPrices.info && Array.isArray(fuelPrices.info)) {
      fuelPrices.info.forEach(item => {
        if (!item || !item.id) return;
        
        const id = item.id;
        // 연료 가격 정보 구조화
        fuelPriceMap[id] = {
          gasoline: parseFloat(item.gasoline) || 0,          // 휘발유
          premium_gasoline: parseFloat(item.premium_gasoline) || 0, // 고급유
          diesel: parseFloat(item.diesel) || 0,          // 경유
          lpg: parseFloat(item.lpg) || 0            // LPG
        };
      });
    }
    
    // 주유소 데이터에 연료 가격 정보 추가
    const stationsWithPrices = stations.map(station => {
      const stationId = station.id;
      if (stationId && fuelPriceMap[stationId]) {
        return {
          ...station,
          fuelPrices: fuelPriceMap[stationId]
        };
      }
      // 가격 정보가 없는 경우 빈 객체 추가
      return {
        ...station,
        fuelPrices: {
          gasoline: 0,
          premium_gasoline: 0,
          diesel: 0,
          lpg: 0
        }
      };
    });
    
    // 마커 생성을 위한 경계 객체 생성
    const markerBounds = new window.kakao.maps.LatLngBounds();

    // 각 주유소에 대한 마커 생성
    for (let i = 0; i < stationsWithPrices.length; i++) {
      const station = stationsWithPrices[i];
      
      // 선택된 유류 종류에 따라 필터링
      if (selectedFuelType.value) {
        // 선택된 유류 종류의 가격이 0인 경우 마커 생성 건너뛰기
        if (!station.fuelPrices || station.fuelPrices[selectedFuelType.value] <= 0) {
          continue;
        }
      }
      
      // 좌표 변환 (KATEC -> WGS84)
      const coords = station.gisxcoor && station.gisycoor
        ? convertKatecToWGS84(parseFloat(station.gisxcoor), parseFloat(station.gisycoor))
        : null;
      
      if (!coords) {
        console.warn(`주유소 ${station.osnm || '알 수 없음'}의 좌표 변환 실패`);
        continue;
      }
      
      try {
        // 마커 생성
        const { marker, infoWindow } = createMarkerWithCoords(
          station, 
          coords, 
          stationsWithPrices, 
          i, 
          markerBounds
        );
        
        if (marker) {
          // 마커 배열에 추가
          markers.value.push(marker);
          
          // 인포윈도우 배열에 추가
          if (infoWindow) {
            infoWindows.value.push(infoWindow);
          }
        }
      } catch (markerError) {
        console.error(`주유소 ${station.osnm || '알 수 없음'} 마커 생성 중 오류:`, markerError);
        // 개별 마커 생성 오류는 무시하고 계속 진행
        continue;
      }
    }

    // 모든 마커가 보이도록 지도 범위 조정
    if (!markerBounds.isEmpty() && map.value) {
      try {
        map.value.setBounds(markerBounds);
      } catch (boundsError) {
        console.error('지도 범위 설정 중 오류:', boundsError);
        // 지도 범위 설정 실패 시 기본 중심으로 이동
        map.value.setCenter(new window.kakao.maps.LatLng(currentCenter.value.lat, currentCenter.value.lng));
      }
    }

    return stationsWithPrices;
  } catch (error) {
    console.error('주유소 마커 생성 중 오류 발생:', error);
    // 오류 발생 시 빈 배열 반환
    return [];
  }
};

// 좌표를 이용한 마커 생성 함수 (createStationMarkers에서 사용)
const createMarkerWithCoords = (station, coords, stationsWithPrices, index, bounds) => {
  if (!coords || !coords.lat || !coords.lng) {
    return { marker: null, infoWindow: null };
  }
  
  try {
    const position = new window.kakao.maps.LatLng(coords.lat, coords.lng);
    
    // 마커 이미지 생성
    const markerImage = createMarkerImage(station, stationsWithPrices, index);
    
    // 마커 생성
    const marker = new window.kakao.maps.Marker({
      position: position,
      image: markerImage,
      title: station.osnm || station.OS_NM || '주유소',
      zIndex: 1
    });
    
    // 마커를 지도에 표시
    if (map.value) {
      marker.setMap(map.value);
    } else {
      console.error('지도 객체가 없어 마커를 표시할 수 없습니다.');
      return { marker: null, infoWindow: null };
    }
    
    // 인포윈도우 내용 생성
    const infoContent = createBasicInfoWindowContent(station, stationsWithPrices);
    
    // 인포윈도우 생성
    const infoWindow = new window.kakao.maps.InfoWindow({
      content: infoContent,
      removable: true
    });
    
    // 마커 클릭 이벤트 처리
    window.kakao.maps.event.addListener(marker, 'click', function() {
      try {
        // 다른 인포윈도우 모두 닫기
        closeAllInfoWindows();
        
        // 현재 마커에 인포윈도우 열기
        infoWindow.open(map.value, marker);
        
        // 인포윈도우 배열에 추가
        infoWindows.value.push(infoWindow);
        
        // 활성 인포윈도우 업데이트
        activeInfoWindow.value = infoWindow;
        
        // 현재 마커를 활성 마커로 설정
        activeMarker.value = marker;
        
        // 선택된 주유소 ID 업데이트 (emit)
        if (station.id) {
          emit('select-station', station.id);
        }
      } catch (clickError) {
        console.error('마커 클릭 이벤트 처리 중 오류:', clickError);
      }
    });
    
    // 마커 ID 매핑 (선택된 주유소 찾기 위함)
    if (station.id) {
      markerMap.value[station.id] = marker;
    }
    
    // 경계에 좌표 추가
    if (bounds) {
      bounds.extend(position);
    }
    
    // 가격 오버레이 생성 (휘발유 가격 우선, 없으면 경유, 없으면 LPG)
    if (station.fuelPrices) {
      try {
        let price = null;
        let fuelType = '';
        let isLowestPrice = false;
        
        if (selectedFuelType.value === 'gasoline' && station.fuelPrices.gasoline && station.fuelPrices.gasoline > 0) {
          price = station.fuelPrices.gasoline;
          fuelType = 'gasoline';
          isLowestPrice = checkIfLowestPrice(station, stationsWithPrices);
        } else if (selectedFuelType.value === 'premium_gasoline' && station.fuelPrices.premium_gasoline && station.fuelPrices.premium_gasoline > 0) {
          price = station.fuelPrices.premium_gasoline;
          fuelType = 'premium_gasoline';
          isLowestPrice = checkIfLowestPriceForFuelType(station, stationsWithPrices, 'premium_gasoline');
        } else if (selectedFuelType.value === 'diesel' && station.fuelPrices.diesel && station.fuelPrices.diesel > 0) {
          price = station.fuelPrices.diesel;
          fuelType = 'diesel';
          isLowestPrice = checkIfLowestPriceForFuelType(station, stationsWithPrices, 'diesel');
        } else if (selectedFuelType.value === 'lpg' && station.fuelPrices.lpg && station.fuelPrices.lpg > 0) {
          price = station.fuelPrices.lpg;
          fuelType = 'lpg';
          isLowestPrice = checkIfLowestPriceForFuelType(station, stationsWithPrices, 'lpg');
        } 
        
        if (price) {
          // 연료 유형 한글 변환
          const fuelTypeKorean = getFuelTypeKorean(fuelType);
          
          // 가격 오버레이 콘텐츠
          const priceContent = document.createElement('div');
          priceContent.className = `price-overlay ${fuelType.toLowerCase()} ${isLowestPrice ? 'lowest-price' : ''}`;
          priceContent.innerHTML = `
            <span class="fuel-type-indicator">${fuelTypeKorean}</span>
            <span class="price-value">${price}원</span>
            ${isLowestPrice ? '<span class="lowest-badge">최저</span>' : ''}
          `;
          
          // 가격 오버레이 생성
          const priceOverlay = new window.kakao.maps.CustomOverlay({
            position: position,
            content: priceContent,
            yAnchor: 0,
            zIndex: 2
          });
          
          // 가격 오버레이 표시
          priceOverlay.setMap(map.value);
          
          // 마커 제거 시 오버레이도 함께 제거하기 위해 마커에 오버레이 참조 저장
          marker.priceOverlay = priceOverlay;
        }
      } catch (overlayError) {
        console.error('가격 오버레이 생성 중 오류:', overlayError);
      }
    }
    
    return { marker, infoWindow };
  } catch (error) {
    console.error('마커 생성 중 오류 발생:', error);
    return { marker: null, infoWindow: null };
  }
};

// 특정 연료 유형의 최저가 확인 함수
const checkIfLowestPriceForFuelType = (station, stations, fuelType) => {
  if (!station.fuelPrices || !stations || !stations.length) return false;
  
  // 해당 연료 유형의 가격이 있는 주유소만 필터링
  const stationsWithFuel = stations.filter(s => {
    if (!s.fuelPrices) return false;
    
    switch(fuelType) {
      case 'gasoline': return s.fuelPrices.gasoline && s.fuelPrices.gasoline > 0;
      case 'diesel': return s.fuelPrices.diesel && s.fuelPrices.diesel > 0;
      case 'lpg': return s.fuelPrices.lpg && s.fuelPrices.lpg > 0;
      case 'premium_gasoline': return s.fuelPrices.premium_gasoline && s.fuelPrices.premium_gasoline > 0;
      default: return false;
    }
  });
  
  if (!stationsWithFuel.length) return false;
  
  // 해당 연료 유형의 최저가 찾기
  const lowestPrice = Math.min(...stationsWithFuel.map(s => {
    switch(fuelType) {
      case 'gasoline': return s.fuelPrices.gasoline;
      case 'diesel': return s.fuelPrices.diesel;
      case 'lpg': return s.fuelPrices.lpg;
      case 'premium_gasoline': return s.fuelPrices.premium_gasoline;
      default: return Infinity;
    }
  }));
  
  // 현재 주유소의 해당 연료 유형 가격
  const stationPrice = (() => {
    switch(fuelType) {
      case 'gasoline': return station.fuelPrices.gasoline;
      case 'diesel': return station.fuelPrices.diesel;
      case 'lpg': return station.fuelPrices.lpg;
      case 'premium_gasoline': return station.fuelPrices.premium_gasoline;
      default: return null;
    }
  })();
  
  // 현재 주유소가 해당 연료 유형의 최저가인지 확인
  return stationPrice === lowestPrice;
};

const createBasicInfoWindowContent = (station, stations) => {
  // 연료 가격 포맷팅 함수
  const formatFuelPrice = (price) => {
    if (!price || price === 0) return '정보 없음';
    return price.toString() + '원';
  };

  // 최저가 여부 확인 함수
  const isLowestPrice = (price, fuelType, stations) => {
    if (!price || price === 0 || !stations || !stations.length) return false;
    
    // 해당 연료 유형의 가격이 있는 주유소만 필터링
    const stationsWithPrice = stations.filter(s => {
      if (!s.fuelPrices) return false;
      
      switch(fuelType) {
        case 'gasoline': return s.fuelPrices.gasoline && s.fuelPrices.gasoline > 0;
        case 'diesel': return s.fuelPrices.diesel && s.fuelPrices.diesel > 0;
        case 'lpg': return s.fuelPrices.lpg && s.fuelPrices.lpg > 0;
        case 'premium_gasoline': return s.fuelPrices.premium_gasoline && s.fuelPrices.premium_gasoline > 0;
        default: return false;
      }
    });
    
    if (!stationsWithPrice.length) return false;
    
    // 해당 연료 유형의 최저가 찾기
    const lowestPrice = Math.min(...stationsWithPrice.map(s => {
      switch(fuelType) {
        case 'gasoline': return s.fuelPrices.gasoline;
        case 'diesel': return s.fuelPrices.diesel;
        case 'lpg': return s.fuelPrices.lpg;
        case 'premium_gasoline': return s.fuelPrices.premium_gasoline;
        default: return Infinity;
      }
    }));
    
    return price === lowestPrice;
  };

  // 인포윈도우 내용 생성
  return `
    <div class="info-window">
      <div class="info-window-title">${station.osnm || station.OS_NM || '주유소'}</div>
      <div class="info-window-content">
        <div class="info-row">
          <span class="info-label">주소:</span>
          <span class="info-value">${station.adr || station.NEW_ADR || station.VAN_ADR || '정보 없음'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">전화:</span>
          <span class="info-value">${station.tel || station.TEL || '정보 없음'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">브랜드:</span>
          <span class="info-value">${station.poll || station.POLL_DIV_CD || '정보 없음'}</span>
        </div>
        ${station.distance ? `
        <div class="info-row">
          <span class="info-label">거리:</span>
          <span class="info-value">${station.distance}m</span>
        </div>` : ''}
        ${station.lpgyn === 'Y' || station.LPG_YN === 'Y' ? `
        <div class="info-row">
          <span class="info-label">LPG:</span>
          <span class="info-value">가능</span>
        </div>` : ''}
        ${station.fuelPrices ? `
        <div class="fuel-prices">
          ${station.fuelPrices.gasoline ? `
          <div class="info-row">
            <span class="info-label">휘발유:</span>
            <span class="info-value ${isLowestPrice(station.fuelPrices.gasoline, 'gasoline', stations) ? 'lowest-price' : ''}">
              ${formatFuelPrice(station.fuelPrices.gasoline)}
              ${isLowestPrice(station.fuelPrices.gasoline, 'gasoline', stations) ? '<span class="lowest-price-badge">최저가</span>' : ''}
            </span>
          </div>` : ''}
          ${station.fuelPrices.premium_gasoline ? `
          <div class="info-row">
            <span class="info-label">고급유:</span>
            <span class="info-value ${isLowestPrice(station.fuelPrices.premium_gasoline, 'premium_gasoline', stations) ? 'lowest-price' : ''}">
              ${formatFuelPrice(station.fuelPrices.premium_gasoline)}
              ${isLowestPrice(station.fuelPrices.premium_gasoline, 'premium_gasoline', stations) ? '<span class="lowest-price-badge">최저가</span>' : ''}
            </span>
          </div>` : ''}
          ${station.fuelPrices.diesel ? `
          <div class="info-row">
            <span class="info-label">경유:</span>
            <span class="info-value ${isLowestPrice(station.fuelPrices.diesel, 'diesel', stations) ? 'lowest-price' : ''}">
              ${formatFuelPrice(station.fuelPrices.diesel)}
              ${isLowestPrice(station.fuelPrices.diesel, 'diesel', stations) ? '<span class="lowest-price-badge">최저가</span>' : ''}
            </span>
          </div>` : ''}
          ${station.fuelPrices.lpg ? `
          <div class="info-row">
            <span class="info-label">LPG:</span>
            <span class="info-value ${isLowestPrice(station.fuelPrices.lpg, 'lpg', stations) ? 'lowest-price' : ''}">
              ${formatFuelPrice(station.fuelPrices.lpg)}
              ${isLowestPrice(station.fuelPrices.lpg, 'lpg', stations) ? '<span class="lowest-price-badge">최저가</span>' : ''}
            </span>
          </div>` : ''}
        </div>` : ''}
      </div>
    </div>
  `;
};

// 선 긋기 주유소 마커 생성 함수
const fnCreateDivisionStationMarker = (station) => {
  // 새로운 API 응답 형식에 맞게 좌표 변환
  const coords = station.gisxcoor && station.gisycoor
    ? convertKatecToWGS84(parseFloat(station.gisxcoor), parseFloat(station.gisycoor))
    : null;

  if (!coords) return null;

  // 마커 위치 설정
  const position = new window.kakao.maps.LatLng(coords.lat, coords.lng);

  // 마커 생성
  const marker = new window.kakao.maps.Marker({
    position: position,
    image: defaultMarkerImage.value,
    clickable: true
  });

  // 마커를 지도에 표시
  marker.setMap(map.value);

  // 가격 오버레이 생성 (선택된 유류 종류에 따라)
  if (station.fuelPrices) {
    let price = 0;
    let fuelType = '';
    let isLowestPrice = false;

    switch (selectedFuelType.value) {
      case 'gasoline':
        if (station.fuelPrices.gasoline && station.fuelPrices.gasoline > 0) {
          price = station.fuelPrices.gasoline;
          fuelType = 'gasoline';
          isLowestPrice = checkIfLowestPriceForFuelType(station, [station], 'gasoline');
        }
        break;
      case 'premium_gasoline':
        if (station.fuelPrices.premium_gasoline && station.fuelPrices.premium_gasoline > 0) {
          price = station.fuelPrices.premium_gasoline;
          fuelType = 'premium_gasoline';
          isLowestPrice = checkIfLowestPriceForFuelType(station, [station], 'premium_gasoline');
        }
        break;
      case 'diesel':
        if (station.fuelPrices.diesel && station.fuelPrices.diesel > 0) {
          price = station.fuelPrices.diesel;
          fuelType = 'diesel';
          isLowestPrice = checkIfLowestPriceForFuelType(station, [station], 'diesel');
        }
        break;
      case 'lpg':
        if (station.fuelPrices.lpg && station.fuelPrices.lpg > 0) {
          price = station.fuelPrices.lpg;
          fuelType = 'lpg';
          isLowestPrice = checkIfLowestPriceForFuelType(station, [station], 'lpg');
        }
        break;
      default:
        // 기본값으로 휘발유 가격 표시
        if (station.fuelPrices.gasoline && station.fuelPrices.gasoline > 0) {
          price = station.fuelPrices.gasoline;
          fuelType = 'gasoline';
          isLowestPrice = checkIfLowestPriceForFuelType(station, [station], 'gasoline');
        }
        break;
    }
    
    if (price > 0) {
      // 연료 유형 한글 변환
      const fuelTypeKorean = getFuelTypeKorean(fuelType);
      
      // 가격 오버레이 콘텐츠 생성
      const priceContent = document.createElement('div');
      priceContent.className = `price-overlay ${fuelType.toLowerCase()} ${isLowestPrice ? 'lowest-price' : ''}`;
      priceContent.innerHTML = `
        <span class="fuel-type-indicator">${fuelTypeKorean}</span>
        <span class="price-value">${price}원</span>
        ${isLowestPrice ? '<span class="lowest-badge">최저</span>' : ''}
      `;
      
      // 가격 오버레이 생성
      const priceOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: priceContent,
        yAnchor: 0,
        zIndex: 2
      });
      
      // 가격 오버레이 표시
      priceOverlay.setMap(map.value);
      
      // 마커 제거 시 오버레이도 함께 제거하기 위해 마커에 오버레이 참조 저장
      marker.priceOverlay = priceOverlay;
    }
  }

  // 인포윈도우 생성
  const infoWindow = new window.kakao.maps.InfoWindow({
    content: createBasicInfoWindowContent(station, [station]),
    removable: true
  });

  // 마커 클릭 이벤트 리스너 등록
  window.kakao.maps.event.addListener(marker, 'click', () => {
    // 모든 인포윈도우 닫기
    closeAllInfoWindows();

    // 현재 인포윈도우 열기
    infoWindow.open(map.value, marker);
    activeInfoWindow.value = infoWindow;

    // 선택된 마커 스타일 변경
    resetMarkerImages();
    marker.setImage(selectedMarkerImage.value);
    selectedMarker.value = marker;

    // 선택된 주유소 ID 저장
    selectedStationId.value = station.id;

    // 이벤트 발생
    emit('select-station', station.id);
  });

  // 마커 정보 반환
  return marker;
};

// 주유소 마커 제거 함수
const clearStationMarkers = () => {
  stationMarkers.value.forEach(marker => {
    // 마커에 연결된 가격 오버레이가 있으면 제거
    if (marker.priceOverlay) {
      marker.priceOverlay.setMap(null);
    }
    // 마커 제거
    marker.setMap(null);
    // 인포윈도우가 있으면 닫기
    if (marker.infoWindow) {
      marker.infoWindow.close();
    }
  });
  stationMarkers.value = [];
};

// 모든 주유소 인포윈도우 닫기 함수
const closeAllStationInfoWindows = () => {
  stationMarkers.value.forEach(marker => {
    if (marker.infoWindow) {
      marker.infoWindow.close();
    }
  });
};

// 모든 인포윈도우 닫기 함수
const closeAllInfoWindows = () => {
  // 모든 인포윈도우 닫기
  infoWindows.value.forEach(infoWindow => {
    if (infoWindow) {
      infoWindow.close();
    }
  });

  // 인포윈도우 배열 초기화
  infoWindows.value = [];

  // 활성 인포윈도우 초기화
  activeInfoWindow.value = null;

  // 활성화된 마커가 있으면 기본 이미지로 변경
  if (activeMarker.value) {
    activeMarker.value.setImage(defaultMarkerImage.value);
    activeMarker.value = null;
  }
};

// 사용자 현재 위치 가져오기 및 표시
const showUserLocation = async () => {
  try {
    // 브라우저 위치 정보 가져오기
    const position = await getCurrentLocation();

    const { latitude, longitude } = position;

    // 사용자 위치 정보 저장
    userLocation.value = { latitude, longitude };

    // 사용자 위치 마커 이미지 생성 (파란색 마커로 변경)
    const markerImage = new window.kakao.maps.MarkerImage(
      // 현재 위치를 나타내는 파란색 마커 이미지 사용
      'data:image/svg+xml;base64,' + window.btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="35" viewBox="0 0 36 48">
          <path fill="#2196F3" d="M18 0C8.1 0 0 8.1 0 18c0 10.8 18 30 18 30s18-19.2 18-30c0-9.9-8.1-18-18-18z"/>
          <circle fill="white" cx="18" cy="18" r="8"/>
          <path fill="#2196F3" d="M18 14c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4 1.8-4 4-4z"/>
        </svg>
      `),
      new window.kakao.maps.Size(35, 45),
      { offset: new window.kakao.maps.Point(18, 48) }
    );

    // 사용자 위치 마커 생성
    const userMarker = new window.kakao.maps.Marker({
      map: map.value,
      position: new window.kakao.maps.LatLng(latitude, longitude),
      image: markerImage,
      zIndex: 10, // 다른 마커보다 위에 표시 (더 높은 값으로 설정)
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
const moveToStation = (station) => {
  // 주유소 좌표 계산
  const coords = station.GIS_X_COOR && station.GIS_Y_COOR
    ? convertKatecToWGS84(parseFloat(station.GIS_X_COOR), parseFloat(station.GIS_Y_COOR))
    : { lat: parseFloat(station.LAT), lng: parseFloat(station.LNG) };

  if (!coords) return;

  // 지도 이동
  const moveLatLng = new window.kakao.maps.LatLng(coords.lat, coords.lng);
  map.value.panTo(moveLatLng);

  // 모든 마커를 기본 이미지로 초기화
  stationMarkers.value.forEach(info => {
    if (info.marker) {
      info.marker.setImage(createStationMarkerImage());
    }
  });

  // 해당 주유소의 마커와 인포윈도우 찾기
  const markerInfo = stationMarkers.value.find(info => {
    if (!info.marker) return false;
    const position = info.marker.getPosition();
    return Math.abs(position.getLat() - coords.lat) < 0.0000001 && 
           Math.abs(position.getLng() - coords.lng) < 0.0000001;
  });

  if (markerInfo) {
    // 선택된 마커 색상 변경
    markerInfo.marker.setImage(createSelectedStationMarkerImage());

    // 모든 인포윈도우 닫기
    closeAllInfoWindows();
    closeAllStationInfoWindows();

    // 선택한 주유소의 인포윈도우 열기
    if (markerInfo.infoWindow) {
      markerInfo.infoWindow.open(map.value, markerInfo.marker);
    }
  }
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
  // return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// 주유소 상세 정보 가져오기
const fetchStationDetail = async (stationId) => {
  try {
    // 이미 가져온 정보가 있으면 캐시에서 사용
    if (stationDetails.value.has(stationId)) {
      return stationDetails.value.get(stationId);
    }

    // API에서 상세 정보 가져오기
    const detailData = await fetchFuelStationDetail(stationId);

    // 캐시에 저장
    if (detailData) {
      stationDetails.value.set(stationId, detailData);
    }

    return detailData;
  } catch (error) {
    console.error('주유소 상세 정보를 가져오는 중 오류가 발생했습니다:', error);
    return null;
  }
};

// 지도 초기화
const initializeMap = async () => {
  try {
    // 카카오맵 SDK 초기화
    await initKakaoMap();

    // 지도 컨테이너 확인
    const mapContainer = document.getElementById('list-kakao-map');
    if (!mapContainer) {
      console.error('지도 컨테이너를 찾을 수 없습니다.');
      return;
    }

    // 지도 중심 좌표 설정 (지역 코드에 따라)
    const center = getAreaCenter(props.selectedArea);
    currentCenter.value = center;

    console.log('지정된 중심 좌표:', currentCenter.value);
    // 지도 옵션 설정
    const mapOptions = {
      center: new window.kakao.maps.LatLng(center.lat, center.lng),
      level: 8
    };

    // 지도 생성
    map.value = new window.kakao.maps.Map(mapContainer, mapOptions);

    // 지도 생성 후 로딩 상태 업데이트
    loading.value = false;

    // 지도 클릭 이벤트 리스너 등록
    window.kakao.maps.event.addListener(map.value, 'click', handleMapClick);

    // 기본 마커 이미지 생성
    defaultMarkerImage.value = createStationMarkerImage();

    // 선택된 마커 이미지 생성
    selectedMarkerImage.value = createSelectedStationMarkerImage();

    // 마커 생성 전 지연 시간 추가 (지도 렌더링 완료 대기)
    await new Promise(resolve => setTimeout(resolve, 500));

    // 사용자 위치 표시
    showUserLocation();

    // 선택된 주유소가 있는 경우 해당 주유소로 이동
    if (props.selectedStationId) {
      showStationInfoWindow(props.selectedStationId);
    }
  } catch (error) {
    console.error('지도 초기화 중 오류 발생:', error);
    loading.value = false;
  }
};

// 지도 클릭 이벤트 처리 함수
const handleMapClick = (mouseEvent) => {
  if (!isDrawMode.value) {
    // 클릭 시 열려있는 인포윈도우 닫기
    closeAllInfoWindows();

    // 활성화된 마커가 있으면 기본 이미지로 변경
    if (activeMarker.value) {
      activeMarker.value.setImage(defaultMarkerImage.value);
      activeMarker.value = null;
    }

    // 선택된 주유소 ID 초기화
    emit('select-station', null);
  } else {
    const clickPosition = mouseEvent.latLng;

    if (!startPoint.value) {
      // 시작점 설정
      startPoint.value = clickPosition;
      startMarker.value = new window.kakao.maps.Marker({
        position: clickPosition,
        map: map.value,
        title: '시작점'
      });
    } else if (!endPoint.value) {
      // 끝점 설정
      endPoint.value = clickPosition;
      endMarker.value = new window.kakao.maps.Marker({
        position: clickPosition,
        map: map.value,
        title: '끝점'
      });

      // 선 그리기
      const path = [startPoint.value, endPoint.value];
      line.value = new window.kakao.maps.Polyline({
        path: path,
        strokeWeight: 3,
        strokeColor: '#db4040',
        strokeOpacity: 1,
        strokeStyle: 'solid'
      });
      line.value.setMap(map.value);

      // 그리기 모드 종료
      isDrawMode.value = false;
    }
  }
};

// 선 그리기 모드 토글
const toggleDrawMode = () => {
  isDrawMode.value = !isDrawMode.value;
  if (!isDrawMode.value) {
    clearLine();
  }
};

// 선 분할하기
const divideLine = async () => {
  if (!startPoint.value || !endPoint.value) return;

  // 기존 마커들 제거
  clearDivideMarkers();
  clearStationMarkers();

  // 선 분할 계산
  const points = divideLineIntoPoints(
    { lat: startPoint.value.getLat(), lng: startPoint.value.getLng() },
    { lat: endPoint.value.getLat(), lng: endPoint.value.getLng() }
  );

  dividePoints.value = points;

  // 분할 지점에서 주유소 검색만 실행
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (i === 0 || i === points.length - 1) continue;
    // 주유소 검색 실행
    searchStationsAroundPoint(point, i);
  }
};

// 주유소 검색 함수
const searchStationsAroundPoint = async (point, index) => {
  if (!point || !point.lat || !point.lng) return;

  // 해당 지점의 상태 초기화
  pointStations.value[index] = {
    loading: true,
    stations: [],
    error: null
  };

  try {
    const { gasStations, fetchGasStations } = useGasStationFinder();

    // 반경 단위를 km에서 m로 변환
    const radiusInMeters = searchRadius.value * 1000;

    // 주유소 검색
    await fetchGasStations(point.lng, point.lat, radiusInMeters);

    // 검색 결과 저장
    pointStations.value[index] = {
      loading: false,
      stations: gasStations.value,
      error: null
    };

    // 주유소 가격 정보 가져오기
    const stationIds = gasStations.value.map(station => station.id);
    const fuelPrices = await fetchFuelPrices(stationIds);

    // 주유소 ID별 연료 가격 매핑
    const fuelPriceMap = {};
    if (fuelPrices && fuelPrices.info && Array.isArray(fuelPrices.info)) {
      fuelPrices.info.forEach(priceInfo => {
        if (priceInfo.id) {
          fuelPriceMap[priceInfo.id] = {
            gasoline: parseInt(priceInfo.gasoline || 0),
            premium_gasoline: parseInt(priceInfo.premium_gasoline || 0),
            diesel: parseInt(priceInfo.diesel || 0),
            lpg: parseInt(priceInfo.lpg || 0)
          };
        }
      });
    }

    // 주유소 데이터에 연료 가격 정보 추가
    const stationsWithPrices = gasStations.value.map(station => {
      const stationId = station.id;
      const fuelPrice = fuelPriceMap[stationId] || {
        gasoline: 0,
        premium_gasoline: 0,
        diesel: 0,
        lpg: 0
      };

      return {
        ...station,
        fuelPrices: fuelPrice
      };
    });

    // 선택된 유류 종류에 맞는 주유소만 필터링
    const filteredStations = stationsWithPrices.filter(station => {
      if (!station.fuelPrices) return false;
      
      switch (selectedFuelType.value) {
        case 'gasoline':
          return station.fuelPrices.gasoline > 0;
        case 'premium_gasoline':
          return station.fuelPrices.premium_gasoline > 0;
        case 'diesel':
          return station.fuelPrices.diesel > 0;
        case 'lpg':
          return station.fuelPrices.lpg > 0;
        default:
          return true;
      }
    });

    // 필터링된 주유소에 대해서만 마커 생성
    filteredStations.forEach(station => {
      const markerInfo = fnCreateDivisionStationMarker(station);
      if (markerInfo) {
        stationMarkers.value.push(markerInfo);
      }
    });
  } catch (error) {
    pointStations.value[index] = {
      loading: false,
      stations: [],
      error: '주유소 검색 중 오류가 발생했습니다.'
    };
  }
};

// 주유소 상세 정보 로딩 함수
const loadStationDetail = async (stationId, infoWindow, station, stations) => {
  try {
    // API에서 상세 정보 가져오기
    const detailData = await fetchFuelStationDetail(stationId);

    if (detailData && detailData.OIL && detailData.OIL[0]) {
      // 상세 정보로 인포윈도우 내용 생성
      const content = `
        <div class="info-window">
          <div class="info-window-title">${station.OS_NM}</div>
          <div class="info-window-content">
            <div class="info-row">
              <span class="info-label">가격:</span>
              <span class="info-value ${isLowestPrice(station.PRICE, stations) ? 'lowest-price' : ''}">${station.PRICE}원</span>
              ${isLowestPrice(station.PRICE, stations) ? '<span class="lowest-price-badge">최저가</span>' : ''}
            </div>
            <div class="info-row">
              <span class="info-label">거리:</span>
              <span class="info-value">${(station.DISTANCE / 1000).toFixed(2)}km</span>
            </div>
            <div class="info-row">
              <span class="info-label">주소:</span>
              <span class="info-value">${detailData.OIL[0].NEW_ADR || detailData.OIL[0].ADR || '주소 정보 없음'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">전화:</span>
              <span class="info-value">${detailData.OIL[0].TEL || '정보 없음'}</span>
            </div>
          </div>
        </div>
      `;

      // 현재 인포윈도우가 열려있는 상태일 때만 내용 업데이트
      if (infoWindow === activeInfoWindow.value) {
        infoWindow.setContent(content);
      }
    }
  } catch (error) {
    console.error('주유소 상세 정보를 가져오는 중 오류가 발생했습니다:', error);
  }
};

// 분할 마커 제거
const clearDivideMarkers = () => {
  divideMarkers.value.forEach(marker => marker.setMap(null));
  divideMarkers.value = [];
  dividePoints.value = [];
};

// 선과 마커 모두 제거
const clearLine = () => {
  if (startMarker.value) {
    startMarker.value.setMap(null);
    startMarker.value = null;
  }
  if (endMarker.value) {
    endMarker.value.setMap(null);
    endMarker.value = null;
  }
  if (line.value) {
    line.value.setMap(null);
    line.value = null;
  }
  startPoint.value = null;
  endPoint.value = null;
  clearDivideMarkers();
  clearStationMarkers();
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
    await fnCreateStationMarkers();
  }
}, { deep: true });

// 선택된 주유소 ID 변경 시 해당 주유소로 지도 이동
const handleSelectStation = (stationId) => {
  showStationInfoWindow(stationId);
};

// selectedStationId 변경 시 처리
const showStationInfoWindow = async (stationId) => {
  if (!stationId || !markerMap.value[stationId]) return;

  const markerInfo = markerMap.value[stationId];
  if (!markerInfo || !markerInfo.marker) return;

  // 이전 선택된 주유소의 마커를 기본 이미지로 변경
  if (selectedStationId.value && markerMap.value[selectedStationId.value]) {
    const prevMarker = markerMap.value[selectedStationId.value].marker;
    if (prevMarker) {
      prevMarker.setImage(createStationMarkerImage());
    }
  }

  // 새로 선택된 마커를 선택 이미지로 변경
  markerInfo.marker.setImage(createSelectedStationMarkerImage());

  // 지도 중심 이동
  const position = markerInfo.marker.getPosition();
  map.value.panTo(position);

  // 인포윈도우 표시
  closeAllInfoWindows();

  if (markerInfo.infoWindow) {
    markerInfo.infoWindow.open(map.value, markerInfo.marker);

    // 인포윈도우 배열에 추가
    infoWindows.value.push(markerInfo.infoWindow);

    // 활성 인포윈도우 저장
    activeInfoWindow.value = markerInfo.infoWindow;
  }

  // 선택된 주유소 ID 업데이트
  selectedStationId.value = stationId;
};

watch(() => props.selectedStationId, (newStationId) => {
  if (newStationId && markerMap.value[newStationId]) {
    showStationInfoWindow(newStationId);
  } else {
    // 선택 해제 시 모든 인포윈도우 닫기
    closeAllInfoWindows();

    // 모든 가격 오버레이 스타일 초기화
    Object.values(markerMap.value).forEach(item => {
      if (item.priceOverlay) {
        item.priceOverlay.setZIndex(3);
      }
    });
  }
});

// 유류 종류 필터링 함수
const changeFuelType = (event) => {
  selectedFuelType.value = event.target.value;
  console.log(`유류 종류 변경: ${selectedFuelType.value}`);

  // 마커 필터링 적용
  fnCreateStationMarkers();
};

// 연료 가격 정보 가져오기
const fetchFuelPrices = async (stationIds) => {
  if (!stationIds || !stationIds.length) {
    console.warn('주유소 ID가 제공되지 않았습니다.');
    return { info: [] }; 
  }

  // 로컬스토리지 캐시 키 생성
  const cacheKey = 'fuelPrices_cache';
  
  try {
    // 캐시된 데이터 확인
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      const parsedCache = JSON.parse(cachedData);
      const currentTime = new Date().getTime();
      
      // 캐시 만료 시간 확인 (1시간 = 3600000 밀리초)
      if (parsedCache.timestamp && (currentTime - parsedCache.timestamp < 3600000)) {
        console.log('캐시된 연료 가격 데이터 사용');
        return parsedCache.data;
      }
    }
    
    // 캐시가 없거나 만료된 경우 API 호출
    const apiUrl = `/api/its/api/infoGasPriceList?code=860665`;
    const response = await axios.get(apiUrl);

    // 응답 데이터 확인
    if (!response.data || !response.data.info) {
      console.warn('연료 가격 데이터가 없거나 형식이 올바르지 않습니다.');
      return { info: [] }; 
    }
    
    // 데이터를 캐시에 저장 (타임스탬프 포함)
    const cacheData = {
      timestamp: new Date().getTime(),
      data: response.data
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log('새로운 연료 가격 데이터 캐싱');
    
    return response.data;
  } catch (error) {
    console.error('연료 가격 정보를 가져오는 중 오류 발생:', error);
    return { info: [] };
  }
};

// 연료 유형 한글 변환 함수
const getFuelTypeKorean = (fuelType) => {
  switch(fuelType) {
    case 'gasoline': return '휘발유';
    case 'diesel': return '경유';
    case 'lpg': return 'LPG';
    case 'premium_gasoline': return '고급유';
    default: return '';
  }
};

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
  moveToStation,
  showStationInfoWindow
});
</script>

<style scoped>
.fuel-list-map {
  position: relative;
  width: 100%;
  height: 600px;
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
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

/* 가격 오버레이 스타일 */
.price-overlay {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
  text-align: center;
  position: relative;
  margin-top: -40px;
  margin-left: -20px;
}

/* 연료 유형별 색상 */
.price-overlay.gasoline {
  border-left: 3px solid #ff6b6b;
}

.price-overlay.premium_gasoline {
  border-left: 3px solid #cc5de8;
}

.price-overlay.diesel {
  border-left: 3px solid #339af0;
}

.price-overlay.lpg {
  border-left: 3px solid #20c997;
}

/* 최저가 스타일 */
.price-overlay.lowest-price {
  background-color: #fff9db;
  border: 1px solid #ffd43b;
  font-weight: bold;
}

.lowest-badge {
  background-color: #ffd43b;
  color: #212529;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
  margin-left: 4px;
}

.fuel-type-indicator {
  font-size: 10px;
  color: #666;
  display: block;
  margin-bottom: 2px;
}

.price-value {
  font-weight: 600;
  color: #333;
}

/* 인포윈도우 스타일 */
.info-window {
  padding: 10px;
  width: 250px;
}

.info-window-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.lowest-price-badge {
  background-color: #ffd43b;
  color: #212529;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  margin-bottom: 8px;
  display: inline-block;
}

.info-window-content {
  font-size: 13px;
}

.info-row {
  margin-bottom: 5px;
  display: flex;
}

.info-label {
  font-weight: 600;
  width: 60px;
  color: #666;
}

.info-value {
  flex: 1;
}

.highlight-price {
  font-weight: bold;
  color: #e03131;
}

.fuel-prices {
  margin-top: 8px;
  border-top: 1px dashed #eee;
  padding-top: 8px;
}

/* 선택 버튼 스타일 */
.fuel-type-select {
  margin-bottom: 10px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 14px;
  width: 100%;
}

.map-controls {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  display: flex;
  gap: 8px;
}

.map-controls button {
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.map-controls button.active {
  background-color: #db4040;
  color: white;
  border-color: #db4040;
}

.radius-control {
  display: flex;
  flex-direction: column;
  background: white;
  padding: 8px;
  border-radius: 4px;
  margin-left: 8px;
}

.radius-control label {
  font-size: 14px;
  margin-bottom: 4px;
}

.radius-control input {
  width: 150px;
}

.fuel-type-filter {
  display: flex;
  flex-direction: column;
  background: white;
  padding: 8px;
  border-radius: 4px;
  margin-left: 8px;
}

.fuel-type-filter label {
  font-size: 14px;
  margin-bottom: 4px;
}

.fuel-type-filter select {
  width: 150px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.divide-points {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 2;
  width: 400px;
}

.points-list {
  margin-top: 10px;
}

.point-item {
  margin-bottom: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.point-header {
  margin-bottom: 8px;
}

.station-list {
  margin-top: 8px;
  margin-left: 16px;
  font-size: 13px;
}

.station-item {
  margin-bottom: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.station-name {
  font-weight: bold;
  margin-bottom: 4px;
  color: #4169E1;
  text-decoration: underline;
  cursor: pointer;
}

.station-name:hover {
  color: #1E90FF;
}

.station-info {
  display: flex;
  gap: 12px;
  color: #666;
}

.station-info-window {
  padding: 10px;
  min-width: 150px;
}

.station-info-window .station-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.station-info-window .station-detail {
  font-size: 13px;
  color: #666;
}

.fuel-prices {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #eee;
}
</style>
