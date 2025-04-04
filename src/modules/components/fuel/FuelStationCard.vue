<template>
  <div 
    class="fuel-station-card" 
    @click="handleCardClick"
  >
    <div class="station-header">
      <div class="station-name">
        {{ gasStations.osnm }}
        <span v-if="isLowestPrice" class="lowest-price-badge">최저가</span>
      </div>
      <div class="station-brand">{{ getBrandName(gasStations.poll) }}</div>
    </div>
    <div class="station-info">
      {{  }}
      <div class="station-price">{{ formatPrice(gasStations.fuelPrices['gasoline']) }}원</div>
      <div class="station-address">{{ gasStations.osnm || '이름없음' }}</div>
      <div v-if="distance !== null" class="station-distance">
        <i class="station-distance-icon">📍</i>현재 위치에서 : {{ (gasStations.distance / 1000).toFixed(1) }} km
      </div>
      <div v-if="wgs84Coords" class="station-coords">
        <i class="station-coords-icon">🌐</i>WGS84 좌표: {{ wgs84Coords.lat.toFixed(6) }}, {{ wgs84Coords.lng.toFixed(6) }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { getBrandName } from '@/modules/fuel/utils/brandUtils';
import { getPriceLevel, isLowestPrice } from '@/modules/fuel/utils/colorUtils';

export default {
  name: 'FuelStationCard',
  props: {
    gasStations: {
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
    },
    selectedFuelType: {
      type: String,
      default: 'gasoline'
    }
  },
  emits: ['select-station', 'show-infowindow'],
  setup(props, { emit }) {
    console.log(props.gasStations)
    // 가격 포맷팅 함수
    const formatPrice = (price) => {
      if (!price) return '정보 없음';
      return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };
    
    // 최저가 여부 계산
    // const stationIsLowestPrice = isLowestPrice(props.gasStations.fuelPrices, props.allStations);
    
    // 거리 정보 상태
    const distance = ref(null);
    
    // WGS84 좌표 정보
    const wgs84Coords = ref(null);
    
    // 카드 클릭 이벤트 핸들러
    const handleCardClick = () => {
      emit('select-station', props.gasStations.UNI_ID);
      emit('show-infowindow', props.gasStations);
    };

    return {
      getBrandName,
      getPriceLevel,
      formatPrice,
      isLowestPrice: false,
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
