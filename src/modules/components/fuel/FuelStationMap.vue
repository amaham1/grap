<template>
  <div class="fuel-station-map">
    <div class="map-header">
      <h2>{{ station.OS_NM }} 위치</h2>
      <button class="close-button" @click="closeMap">✕</button>
    </div>
    <div id="kakao-map" class="map-container"></div>
    <div class="station-info">
      <div class="info-row">
        <span class="label">상호:</span>
        <span class="value">{{ station.OS_NM }}</span>
      </div>
      <div class="info-row">
        <span class="label">주소:</span>
        <span class="value">{{ station.NEW_ADR || station.VAN_ADR }}</span>
        <button class="copy-button" @click="copyAddress" title="주소 복사">
          <i class="copy-icon">📋</i>
        </button>
      </div>
      <div class="info-row">
        <span class="label">가격:</span>
        <span class="value price">{{ formatPrice(station.PRICE) }}원</span>
      </div>
      <div class="info-row">
        <span class="label">브랜드:</span>
        <span class="value">{{ getBrandName(station.POLL_DIV_CD) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineProps, defineEmits, watch } from 'vue';
import { initKakaoMap } from '@/api/kakaoMapApi';
import { isValidCoordinate } from '@/modules/fuel/utils/coordinateUtils';
import { getCoordinatesByAddress, convertCoordinate } from '@/modules/fuel/api/kakaoMapService';
import { copyWithNotification } from '@/modules/utils/clipboardUtils';
import { getBrandName } from '@/modules/fuel/utils/brandUtils';
import { getPriceColor } from '@/modules/fuel/utils/colorUtils';

const props = defineProps({
  station: {
    type: Object,
    required: true
  },
  stationIndex: {
    type: Number,
    default: 10 // 기본값으로 중간 인덱스 사용
  },
  totalStations: {
    type: Number,
    default: 20 // 기본값으로 20개 사용
  },
  selectedStation: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close']);

const map = ref(null);
const marker = ref(null);
const coordinates = ref({ lat: 33.5113, lng: 126.5292 }); // 제주 기본 좌표

// 가격 포맷팅 함수
const formatPrice = (price) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// 브랜드별 마커 이미지 생성 함수
const createMarkerImage = (station) => {
  // 가격에 따른 색상 결정
  const color = getPriceColor(parseFloat(station.PRICE), props.totalStations);
  
  // SVG 마커 생성
  const svgMarker = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="35" viewBox="0 0 24 35">
      <path fill="${color}" d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 23 12 23s12-15.8 12-23c0-6.6-5.4-12-12-12z"/>
      <circle fill="white" cx="12" cy="12" r="5"/>
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

// 맵 닫기 함수
const closeMap = () => {
  emit('close');
};

// 주소 복사 함수
const copyAddress = () => {
  const address = props.station.NEW_ADR || props.station.VAN_ADR;
  copyWithNotification(address, '주소가 복사되었습니다');
};

// 주소로 좌표 찾기
const getCoordinatesByStationAddress = async (stationObj) => {
  try {
    // 주유소 주소 추출
    const station = stationObj || props.station;
    const address = station.NEW_ADR || station.VAN_ADR;
    if (!address) {
      console.warn('주유소 주소 정보가 없습니다.');
      return null;
    }

    // 카카오 주소 검색 API를 통해 좌표 검색
    const result = await getCoordinatesByAddress(address);
    if (result) {
      console.log('주소로 찾은 좌표:', result);
      return result;
    }
    return null;
  } catch (error) {
    console.error('주소 검색 중 오류 발생:', error);
    return null;
  }
};

// 지도 이동 및 확대 함수
const moveToStation = (station) => {
  if (!map.value || !station) return;
  
  // 좌표 설정
  const position = new window.kakao.maps.LatLng(coordinates.value.lat, coordinates.value.lng);
  
  // 지도 이동
  map.value.setCenter(position);
  
  // 지도 확대 레벨 설정 (낮을수록 더 확대됨, 1~14)
  map.value.setLevel(3);
  
  // 마커 위치 업데이트
  if (marker.value) {
    marker.value.setPosition(position);
  }
};

// 선택된 주유소가 변경되면 지도 이동
watch(() => props.selectedStation, (newStation) => {
  if (newStation && newStation.OS_NM) {
    // 주소로 좌표 찾기
    getCoordinatesByStationAddress(newStation).then(coords => {
      if (coords) {
        coordinates.value = coords;
        moveToStation(newStation);
      }
    });
  }
}, { immediate: true });

const initializeMap = async () => {
  try {
    // 카카오맵 SDK 초기화
    await initKakaoMap();
    
    // 지도 컨테이너 확인
    const container = document.getElementById('kakao-map');
    if (!container) {
      console.warn('지도를 표시할 DOM 요소를 찾을 수 없습니다.');
      return;
    }

    let stationCoordinates = await getCoordinatesByStationAddress();

    // 검색된 좌표가 있으면 사용, 없으면 기본 좌표 사용
    if (stationCoordinates) {
      coordinates.value = stationCoordinates;
    }

    // 지도 옵션 설정
    const options = {
      center: new window.kakao.maps.LatLng(coordinates.value.lat, coordinates.value.lng),
      level: 5
    };

    console.log('지도 초기화 옵션:', options);

    // 지도 생성
    map.value = new window.kakao.maps.Map(container, options);
    
    // 마커 이미지 생성
    const markerImage = createMarkerImage(props.station);
    
    // 마커 생성
    marker.value = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(coordinates.value.lat, coordinates.value.lng),
      image: markerImage,
      map: map.value
    });

    // 인포윈도우 생성
    const infowindow = new window.kakao.maps.InfoWindow({
      content: `<div style="padding:5px;font-size:12px;">${props.station.OS_NM}</div>`
    });
    infowindow.open(map.value, marker.value);
    
    // 선택된 주유소가 있으면 해당 위치로 이동
    if (props.selectedStation) {
      moveToStation(props.selectedStation);
    }

  } catch (error) {
    console.error('지도 초기화 중 오류 발생:', error);
  }
};

// 컴포넌트가 마운트될 때 지도 초기화
onMounted(() => {
  initializeMap();
});

// 컴포넌트가 언마운트될 때 정리
onUnmounted(() => {
  // 필요한 경우 정리 작업 수행
  map.value = null;
  marker.value = null;
});
</script>

<style scoped>
.fuel-station-map {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  max-width: 600px;
  height: 80vh;
  max-height: 700px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.map-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #343a40;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6c757d;
  cursor: pointer;
  line-height: 1;
}

.close-button:hover {
  color: #343a40;
}

.map-container {
  flex-grow: 1;
  width: 100%;
}

.station-info {
  padding: 12px 16px;
  border-top: 1px solid #dee2e6;
}

.info-row {
  display: flex;
  margin-bottom: 6px;
  align-items: center;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: 600;
  color: #495057;
  width: 70px;
}

.value {
  flex: 1;
  color: #212529;
}

.price {
  color: #dc3545;
  font-weight: 600;
}

.copy-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-left: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.copy-button:hover {
  opacity: 1;
}

.copy-icon {
  font-size: 16px;
  line-height: 1;
}
</style>
