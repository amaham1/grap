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
import { ref, onMounted, onUnmounted, watch, defineProps, defineEmits } from 'vue';
import { getBrandName } from '@/modules/fuel/utils/brandUtils';
import { calculateHaversineDistance } from '@/modules/fuel/api/kakaoMobilityService';
import { fetchFuelStationDetail } from '@/modules/fuel/api/fuelService';
import { initKakaoMap } from '@/api/kakaoMapApi';
import { getCoordinatesByAddress } from '@/modules/fuel/api/kakaoMapService';
import { getPriceColor, isLowestPrice } from '@/modules/fuel/utils/colorUtils';
import { formatDistance, getCurrentLocation } from '@/modules/fuel/api/kakaoMobilityService';
import { convertKatecToWGS84 } from '@/modules/fuel/utils/coordinateUtils';
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
const activeInfoWindow = ref(null);
const stationDetails = ref(new Map());
const activeMarker = ref(null); // 현재 활성화된 마커
const defaultMarkerImage = ref(null); // 기본 마커 이미지
const selectedMarkerImage = ref(null); // 선택된 마커 이미지

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
  // 최저가 주유소 확인
  const isLowestPriceStation = isLowestPrice(station.PRICE, allStations);
  
  // SVG 마커 생성 (최저가일 경우 다른 모양으로 표시)
  let svgMarker;
  
  if (isLowestPriceStation) {
    // 최저가 주유소 마커 (파스텔톤 색상)
    svgMarker = `
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="32" viewBox="0 0 36 48">
        <path fill="#FFB6C1" d="M18 0C8.1 0 0 8.1 0 18c0 10.8 18 30 18 30s18-19.2 18-30c0-9.9-8.1-18-18-18z"/>
        <circle fill="white" cx="18" cy="18" r="8"/>
        <path fill="#FFC0CB" d="M18 8l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>
      </svg>
    `;
  } else {
    // 일반 주유소 마커 (모두 동일한 마커 사용)
    svgMarker = `
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="32" viewBox="0 0 36 48">
        <path fill="#4CAF50" d="M18 0C8.1 0 0 8.1 0 18c0 10.8 18 30 18 30s18-19.2 18-30c0-9.9-8.1-18-18-18z"/>
        <circle fill="white" cx="18" cy="18" r="8"/>
        <path fill="#4CAF50" d="M22 18c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4 4 1.8 4 4z"/>
      </svg>
    `;
  }
  
  // SVG를 Base64로 인코딩
  const encodedSvg = window.btoa(svgMarker);
  
  // 마커 이미지 생성
  return new window.kakao.maps.MarkerImage(
    'data:image/svg+xml;base64,' + encodedSvg,
    new window.kakao.maps.Size(25, 36),
    { offset: new window.kakao.maps.Point(18, 48) }
  );
};

// 마커 생성 함수
const createMarkers = async () => {
  // 기존 마커 제거
  clearMarkers();
  
  // 사용자 위치 표시
  const userLocation = await showUserLocation();
  
  if (!props.fuelStations || props.fuelStations.length === 0) return;
  
  // 모든 주유소에 대해 마커 생성
  const bounds = new window.kakao.maps.LatLngBounds();
  
  // 사용자 위치가 있으면 바운드에 추가
  if (userLocation) {
    bounds.extend(new window.kakao.maps.LatLng(userLocation.latitude, userLocation.longitude));
  }
  
  // 주유소 마커 생성 함수 호출
  await createStationMarkers(props.fuelStations, bounds);
  
  // 모든 마커가 보이도록 지도 범위 조정
  if (markers.value.length > 0) {
    map.value.setBounds(bounds);
  }
};

// 주유소 마커 생성 함수 (모듈화)
const createStationMarkers = async (stations, bounds) => {
  // 각 주유소에 대한 마커 생성
  for (const [index, station] of stations.entries()) {
    try {
      let coords = null;
      
      // 1. 주유소 객체에 GIS_X_COOR와 GIS_Y_COOR 필드가 있는지 확인 (KATEC 좌표)
      if (station.GIS_X_COOR && station.GIS_Y_COOR) {
        // KATEC 좌표를 WGS84로 변환
        const katecX = parseFloat(station.GIS_X_COOR);
        const katecY = parseFloat(station.GIS_Y_COOR);
        
        const wgs84 = convertKatecToWGS84(katecX, katecY);
        if (wgs84) {
          coords = {
            lat: wgs84.lat,
            lng: wgs84.lng
          };
        }
      } 
      // 2. 주유소 객체에 LAT, LNG 필드가 있는지 확인
      else if (station.LAT && station.LNG) {
        coords = {
          lat: parseFloat(station.LAT),
          lng: parseFloat(station.LNG)
        };
      }
      // 3. 위경도 정보가 없는 경우 주소로 좌표 변환 (기존 방식)
      else {
        const address = station.NEW_ADR || station.VAN_ADR;
        if (!address) continue;
        
        // 카카오 API로 주소를 좌표로 변환
        coords = await getCoordinatesByAddress(address);
      }
      
      // 좌표가 없으면 다음 주유소로
      if (!coords) continue;
      
      // 마커 위치 생성
      const position = new window.kakao.maps.LatLng(coords.lat, coords.lng);
      
      // 마커 이미지 생성
      const markerImage = createMarkerImage(station, stations, index);
      
      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        map: map.value,
        position: position,
        image: markerImage, // 커스텀 마커 이미지 사용
        title: station.OS_NM,
        zIndex: isLowestPrice(station.PRICE, stations) ? 5 : 1, // 최저가 주유소는 더 높은 zIndex로 설정
        clickable: true // 클릭 가능하도록 설정
      });
      
      // 가격 표시 커스텀 오버레이 생성
      const priceContent = `
        <div class="price-overlay ${isLowestPrice(station.PRICE, stations) ? 'lowest-price' : ''}">
          ${formatPrice(station.PRICE)}원
        </div>
      `;
      
      const priceOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: priceContent,
        yAnchor: 3,
        zIndex: 3
      });
      
      // 커스텀 오버레이를 지도에 표시
      priceOverlay.setMap(map.value);
      
      // 거리 계산 (사용자 위치가 있는 경우)
      let distanceText = '';
      if (userLocation.value) {
        const distanceInKm = calculateHaversineDistance(
          userLocation.value.latitude,
          userLocation.value.longitude,
          coords.lat,
          coords.lng
        );
        
        // 거리 포맷팅 (km 단위)
        distanceText = formatDistance(distanceInKm * 1000);
      }
      
      // 인포윈도우 내용 생성
      const infoContent = createInfoWindowContent(station, stations);
      
      // 인포윈도우 생성
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: infoContent,
        removable: true,
        zIndex: 10
      });
      
      // 마커 클릭 이벤트 리스너 등록
      window.kakao.maps.event.addListener(marker, 'click', function() {
        // 기존 열린 인포윈도우 닫기
        closeAllInfoWindows();
        
        // 기존 활성화 마커가 있으면 기본 이미지로 변경
        if (activeMarker.value && activeMarker.value !== marker) {
          activeMarker.value.setImage(defaultMarkerImage.value);
        }
        
        // 현재 마커를 선택된 이미지로 변경
        marker.setImage(selectedMarkerImage.value);
        
        // 현재 마커를 활성 마커로 설정
        activeMarker.value = marker;
        
        // 기본 정보로 인포윈도우 생성
        const initialContent = createInfoWindowContent(station, stations);
        
        const infoWindow = new window.kakao.maps.InfoWindow({
          content: initialContent,
          removable: true,
          zIndex: 10
        });
        
        // 인포윈도우 닫힘 이벤트 리스너 등록
        window.kakao.maps.event.addListener(infoWindow, 'closeclick', function() {
          // 마커 이미지를 기본으로 변경
          if (activeMarker.value === marker) {
            marker.setImage(defaultMarkerImage.value);
            activeMarker.value = null;
          }
        });
        
        // 인포윈도우 열기
        infoWindow.open(map.value, marker);
        
        // 활성 인포윈도우 저장
        activeInfoWindow.value = infoWindow;
        
        // 선택한 주유소 ID 이벤트 발생
        emit('select-station', station.UNI_ID);
        
        // 상세 정보 로딩 표시
        infoWindow.setContent(createInfoWindowContent(station, stations, undefined));
        
        // 별도 함수로 상세 정보 로딩 처리
        loadStationDetail(station.UNI_ID, infoWindow, station, stations);
      });
      
      // 마커 배열에 추가
      markers.value.push(marker);
      
      // 마커맵에 저장
      markerMap.value[station.UNI_ID] = marker;
      
      // 경계 확장
      bounds.extend(position);
    } catch (error) {
      console.error(`주유소 마커 생성 중 오류 발생 (${station.OS_NM}):`, error);
    }
  }
  
  return markers.value.length;
};

// 최저가 주유소 표시 함수
const showLowestPriceStations = async (lowestPriceStations) => {
  // 기존 마커 제거
  clearMarkers();
  
  if (!lowestPriceStations || lowestPriceStations.length === 0) {
    console.warn('표시할 최저가 주유소가 없습니다.');
    return;
  }
  
  // 모든 주유소에 대해 마커 생성
  const bounds = new window.kakao.maps.LatLngBounds();
  
  // 주유소 마커 생성 함수 호출
  await createStationMarkers(lowestPriceStations, bounds);
  
  // 모든 마커가 보이도록 지도 범위 조정
  if (markers.value.length > 0) {
    map.value.setBounds(bounds);
  }
};

// 모든 인포윈도우 닫기 함수
const closeAllInfoWindows = () => {
  // 열려있는 인포윈도우가 있으면 닫기
  if (activeInfoWindow.value) {
    activeInfoWindow.value.close();
    activeInfoWindow.value = null;
    
    // 활성화된 마커가 있으면 기본 이미지로 변경
    if (activeMarker.value) {
      activeMarker.value.setImage(defaultMarkerImage.value);
      activeMarker.value = null;
    }
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

// 인포윈도우 내용 생성
const createInfoWindowContent = (station, stations, detailData = null) => {
  console.log(detailData)
  // 거리 계산 (사용자 위치가 있는 경우)
  let distanceText = '';
  if (userLocation.value) {
    // 거리 포맷팅 (km 단위)
    distanceText = formatDistance(station.DISTANCE);
  }
  
  // 기본 정보
  let content = `
    <div class="station-info-window ${isLowestPrice(station.PRICE, stations) ? 'lowest-price' : ''}">
      <h3>
        ${station.OS_NM}
        ${isLowestPrice(station.PRICE, stations) ? '<span class="lowest-price-badge">최저가</span>' : ''}
      </h3>
      <p>브랜드: ${getBrandName(station.POLL_DIV_CD)}</p>
      <p>주소 ${detailData?.OIL[0].NEW_ADR || '주소 정보가 없습니다'}</p>
      <p>가격: <span class="price-value">${formatPrice(station.PRICE)}원</span></p>
      ${distanceText ? `<p>거리: ${distanceText}</p>` : ''}
  `;
  
  // 상세 정보가 있는 경우 추가
  if (detailData) {
    content += `
      <div class="detail-info">
        <h4>상세 정보</h4>
        ${detailData?.OIL[0].TEL ? `<p>전화번호: ${detailData.OIL[0].TEL}</p>` : ''}
        <p>경정비 시설: ${detailData?.OIL[0].MAINT_YN === 'Y' ? '있음' : '없음'}</p>
        <p>세차장: ${detailData?.OIL[0].CAR_WASH_YN === 'Y' ? '있음' : '없음'}</p>
        <p>편의점: ${detailData?.OIL[0].CVS_YN === 'Y' ? '있음' : '없음'}</p>
        <p>품질인증: ${detailData?.OIL[0].KPETRO_YN === 'Y' ? '있음' : '없음'}</p>
      </div>
    `;
  }
  
  // 로딩 중이거나 상세 정보가 없는 경우
  if (detailData === undefined) {
    content += `
      <div class="detail-info">
        <p>상세 정보를 불러오는 중...</p>
      </div>
    `;
  }
  
  content += `</div>`;
  
  return content;
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
    
    // 기본 마커 이미지 생성
    defaultMarkerImage.value = new window.kakao.maps.MarkerImage(
      'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
      new window.kakao.maps.Size(22, 36)
    );
    
    // 선택된 마커 이미지 생성 (다른 색상의 마커)
    selectedMarkerImage.value = new window.kakao.maps.MarkerImage(
      'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png', 
      new window.kakao.maps.Size(24, 35)
    );
    
    // 지도 클릭 이벤트 리스너 등록
    window.kakao.maps.event.addListener(map.value, 'click', handleMapClick);
    
    // 마커 생성
    await createMarkers();
    
    loading.value = false;
  } catch (error) {
    console.error('지도 초기화 중 오류 발생:', error);
    loading.value = false;
  }
};

// 지도 클릭 이벤트 처리 함수
const handleMapClick = () => {
  // 클릭 시 열려있는 인포윈도우 닫기
  closeAllInfoWindows();
  
  // 활성화된 마커가 있으면 기본 이미지로 변경
  if (activeMarker.value) {
    activeMarker.value.setImage(defaultMarkerImage.value);
    activeMarker.value = null;
  }
  
  // 선택된 주유소 ID 초기화
  emit('select-station', null);
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
  showStationInfoWindow(stationId);
};

// selectedStationId 변경 시 처리
const showStationInfoWindow = (stationId) => {
  // 해당 ID의 마커 찾기
  const marker = markerMap.value[stationId];
  if (!marker) return;
  
  // 기존 열린 인포윈도우 닫기
  closeAllInfoWindows();
  
  // 기존 활성화 마커가 있으면 기본 이미지로 변경
  if (activeMarker.value && activeMarker.value !== marker) {
    activeMarker.value.setImage(defaultMarkerImage.value);
  }
  
  // 현재 마커를 선택된 이미지로 변경
  marker.setImage(selectedMarkerImage.value);
  
  // 현재 마커를 활성 마커로 설정
  activeMarker.value = marker;
  
  // 해당 주유소 정보 찾기
  const station = props.fuelStations.find(s => s.UNI_ID === stationId);
  if (!station) return;
  
  // 기본 정보로 인포윈도우 생성
  const initialContent = createInfoWindowContent(station, props.fuelStations);
  
  const infoWindow = new window.kakao.maps.InfoWindow({
    content: initialContent,
    removable: true,
    zIndex: 10
  });
  
  // 인포윈도우 닫힘 이벤트 리스너 등록
  window.kakao.maps.event.addListener(infoWindow, 'closeclick', function() {
    // 마커 이미지를 기본으로 변경
    if (activeMarker.value === marker) {
      marker.setImage(defaultMarkerImage.value);
      activeMarker.value = null;
    }
  });
  
  // 인포윈도우 열기
  infoWindow.open(map.value, marker);
  
  // 활성 인포윈도우 저장
  activeInfoWindow.value = infoWindow;
  
  // 상세 정보 로딩 표시
  infoWindow.setContent(createInfoWindowContent(station, props.fuelStations, undefined));
  
  // 별도 함수로 상세 정보 로딩 처리
  loadStationDetail(stationId, infoWindow, station, props.fuelStations);
  
  // 지도 중심 이동
  const position = marker.getPosition();
  map.value.panTo(position);
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

// 주유소 상세 정보 로딩 함수
const loadStationDetail = async (stationId, infoWindow, station, stations) => {
  try {
    // API에서 상세 정보 가져오기
    const detailData = await fetchStationDetail(stationId);
    
    console.log("detailData ", station)
    console.log("detailData ", detailData)
    
    // 상세 정보로 인포윈도우 업데이트
    infoWindow.setContent(createInfoWindowContent(station, stations, detailData));
  } catch (error) {
    console.error('주유소 상세 정보를 가져오는 중 오류가 발생했습니다:', error);
    
    // 오류 발생 시 기본 정보만 표시
    const initialContent = createInfoWindowContent(station, stations);
    infoWindow.setContent(initialContent);
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
  showLowestPriceStations,
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
:deep(.price-overlay) {
  background-color: white;
  color: #333;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  border: 1px solid #ddd;
  white-space: nowrap;
}

:deep(.price-overlay.lowest-price) {
  background-color: #ffeb3b;
  color: #333;
  border-color: #ffc107;
}

/* 인포윈도우 스타일 */
:deep(.station-info-window) {
  padding: 15px;
  width: 300px;
  font-size: 14px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  line-height: 1.5;
}

:deep(.station-info-window h3) {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: bold;
  color: #333;
}

:deep(.station-info-window p) {
  margin: 5px 0;
}

:deep(.station-info-window .detail-info) {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

:deep(.station-info-window .detail-info h4) {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: bold;
}

:deep(.station-info-window.lowest-price) {
  border-left: 4px solid #ff6b6b;
}

:deep(.lowest-price-badge) {
  background-color: #ffeb3b;
  color: #333;
  font-size: 11px;
  padding: 2px 5px;
  border-radius: 3px;
  margin-left: 5px;
  font-weight: bold;
}

:deep(.price-value) {
  font-weight: bold;
  color: #e53935;
}
</style>
