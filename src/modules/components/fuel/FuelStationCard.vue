<template>
  <div 
    class="fuel-station-card" 
    :class="[
      { 'selected': selected }, 
      { 'lowest-price': isLowestPrice }, 
      `price-level-${getPriceLevel(station.PRICE, allStations)}`
    ]"
    @click="handleCardClick"
  >
    <div class="station-header">
      <div class="station-name">
        {{ station.OS_NM }}
        <span v-if="isLowestPrice" class="lowest-price-badge">최저가</span>
      </div>
      <div class="station-brand">{{ getBrandName(station.POLL_DIV_CD) }}</div>
    </div>
    <div class="station-info">
      <div class="station-price">{{ formatPrice(station.PRICE) }}원</div>
      <div class="station-address">{{ station.NEW_ADR || station.VAN_ADR }}</div>
      <div v-if="distance !== null" class="station-distance">
        <i class="station-distance-icon">📍</i>현재 위치에서 : {{ (station.DISTANCE / 1000).toFixed(1) }} km
      </div>
      <div v-if="wgs84Coords" class="station-coords">
        <i class="station-coords-icon">🌐</i>WGS84 좌표: {{ wgs84Coords.lat.toFixed(6) }}, {{ wgs84Coords.lng.toFixed(6) }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch, inject } from 'vue';
import { getBrandName } from '@/modules/fuel/utils/brandUtils';
import { getPriceColor, getPriceLevel, isLowestPrice } from '@/modules/fuel/utils/colorUtils';
import { getCurrentLocation, formatDistance, calculateHaversineDistance } from '@/modules/fuel/api/kakaoMobilityService';
import { getCoordinatesByAddress } from '@/modules/fuel/api/kakaoMapService';
import { convertKatecToWGS84 } from '@/modules/fuel/utils/coordinateUtils';

export default {
  name: 'FuelStationCard',
  props: {
    station: {
      type: Object,
      required: true
    },
    allStations: {
      type: Array,
      default: () => []
    },
    selected: {
      type: Boolean,
      default: false
    },
    userLocation: {
      type: Object,
      default: null
    }
  },
  emits: ['select-station', 'show-infowindow'],
  setup(props, { emit }) {
    // 가격 포맷팅 함수
    const formatPrice = (price) => {
      return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };
    
    // 최저가 여부 계산
    const stationIsLowestPrice = isLowestPrice(props.station.PRICE, props.allStations);
    
    // 거리 정보 상태
    const distance = ref(null);
    
    // WGS84 좌표 정보
    const wgs84Coords = ref(null);
    
    // 카드 클릭 이벤트 핸들러
    const handleCardClick = () => {
      emit('select-station', props.station.UNI_ID);
      emit('show-infowindow', props.station);
    };
    
    // 거리 계산 함수
    const calculateStationDistance = async () => {
      try {
        // 사용자 위치가 props로 전달되었는지 확인
        let userLocation = props.userLocation;
        
        // props로 전달되지 않았다면 현재 위치 가져오기
        if (!userLocation) {
          userLocation = await getCurrentLocation();
        }
        
        // 주유소 좌표 확인
        let stationLat, stationLng;
        
        // 주유소 객체에 GIS_X_COOR와 GIS_Y_COOR 필드가 있는지 확인 (KATEC 좌표)
        if (props.station.GIS_X_COOR && props.station.GIS_Y_COOR) {
          // KATEC 좌표를 WGS84로 변환
          const katecX = parseFloat(props.station.GIS_X_COOR);
          const katecY = parseFloat(props.station.GIS_Y_COOR);
          
          const wgs84 = convertKatecToWGS84(katecX, katecY);
          if (wgs84) {
            stationLat = wgs84.lat;
            stationLng = wgs84.lng;
            wgs84Coords.value = wgs84;
          }
        } 
        // 주유소 객체에 LAT, LNG 필드가 있는지 확인
        else if (props.station.LAT && props.station.LNG) {
          stationLat = parseFloat(props.station.LAT);
          stationLng = parseFloat(props.station.LNG);
          wgs84Coords.value = { lat: stationLat, lng: stationLng };
        }
        // 주소로 좌표 변환
        else {
          const address = props.station.NEW_ADR || props.station.VAN_ADR;
          if (!address) {
            distance.value = '주소 정보 없음';
            return;
          }
          
          // 카카오 API로 주소를 좌표로 변환
          const stationCoords = await getCoordinatesByAddress(address);
          if (!stationCoords) {
            distance.value = '좌표 변환 실패';
            return;
          }
          
          stationLat = stationCoords.lat;
          stationLng = stationCoords.lng;
          wgs84Coords.value = stationCoords;
        }
        
        // 하버사인 공식으로 직선 거리 계산 (km)
        const distanceInKm = calculateHaversineDistance(
          userLocation.latitude, 
          userLocation.longitude,
          stationLat, 
          stationLng
        );
        
        // 미터 단위로 변환
        const distanceInMeters = distanceInKm * 1000;
        
        // 거리 포맷팅
        distance.value = formatDistance(distanceInMeters);
      } catch (error) {
        console.error('거리 계산 중 오류 발생:', error);
        distance.value = '거리 정보 없음';
      }
    };
    
    // 컴포넌트 마운트 시 거리 계산
    onMounted(() => {
      calculateStationDistance();
    });
    
    // userLocation이 변경될 때 거리 재계산
    watch(() => props.userLocation, (newLocation) => {
      if (newLocation) {
        calculateStationDistance();
      }
    });
    
    // station이 변경될 때 거리 재계산
    watch(() => props.station, (newStation) => {
      calculateStationDistance();
    }, { deep: true });

    return {
      getBrandName,
      getPriceLevel,
      formatPrice,
      isLowestPrice: stationIsLowestPrice,
      distance,
      wgs84Coords,
      handleCardClick
    };
  }
};
</script>

<style scoped>
.fuel-station-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  padding: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
  border-left: 4px solid #ccc; /* 기본 테두리 색상 */
  position: relative;
}

.fuel-station-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.fuel-station-card.selected {
  box-shadow: 0 0 0 2px #4a90e2, 0 4px 12px rgba(0, 0, 0, 0.15);
  background-color: #f0f8ff;
}

.fuel-station-card.selected::after {
  content: '✓';
  position: absolute;
  top: 8px;
  right: 8px;
  color: #4a90e2;
  font-weight: bold;
  font-size: 16px;
}

/* 가격 레벨에 따른 테두리 색상 */
.fuel-station-card.price-level-1 {
  border-left-color: #4CAF50; /* 저가 - 녹색 */
}

.fuel-station-card.price-level-2 {
  border-left-color: #FFC107; /* 중간가 - 노란색 */
}

.fuel-station-card.price-level-3 {
  border-left-color: #FF5722; /* 고가 - 주황색 */
}

/* 최저가 주유소 스타일 */
.fuel-station-card.lowest-price {
  border-left-color: gold;
  background-color: rgba(255, 215, 0, 0.05);
}

.fuel-station-card.lowest-price.selected {
  background-color: rgba(255, 215, 0, 0.15);
  box-shadow: 0 0 0 2px gold, 0 4px 12px rgba(0, 0, 0, 0.15);
}

.station-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.station-name {
  font-weight: bold;
  font-size: 1.1em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.lowest-price-badge {
  background-color: gold;
  color: #333;
  font-size: 0.7em;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}

.station-brand {
  color: #666;
  font-size: 0.9em;
}

.station-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.station-price {
  font-size: 1.2em;
  font-weight: bold;
  color: #e74c3c;
}

.station-address {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 4px;
}

.station-distance, .station-coords {
  font-size: 0.85em;
  color: #555;
  display: flex;
  align-items: center;
  gap: 4px;
}

.station-distance-icon, .station-coords-icon {
  font-style: normal;
}
</style>
