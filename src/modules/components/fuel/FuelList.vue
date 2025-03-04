<template>
  <div class="fuel-list-container">
    <h1 class="title">반경 내 주유소 정보</h1>
    
    <div class="filters">
      <fuel-filter 
        :selected-fuel-type="selectedFuelType" 
        :selected-area="selectedArea"
        @update:selected-fuel-type="selectedFuelType = $event"
        @update:selected-area="selectedArea = $event"
      />
    </div>
    
    <!-- 카카오 맵 컴포넌트 -->
    <div class="map-section">
      <fuel-list-map 
        ref="fuelListMapRef"
        :fuel-stations="gasStations" 
        :selected-area="selectedArea"
        :selected-station-id="selectedStationId"
        @select-station="handleStationSelect"
      />
    </div>
    
    <div v-if="loading" class="loading">
      <p>데이터를 불러오는 중입니다...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <p>데이터를 불러오는 중 오류가 발생했습니다: {{ error }}</p>
    </div>
    
    <div v-else-if="!gasStations.length" class="empty-result">
      <p>조회된 주유소가 없습니다.</p>
    </div>
    
    <div v-else class="fuel-stations-list">
      <fuel-station-card 
        v-for="(station, index) in gasStations" 
        :key="station.UNI_ID" 
        :station="station"
        :allStations="gasStations"
        :selected="selectedStationId === station.UNI_ID"
        :userLocation="userLocation"
        @select-station="handleStationSelect"
      />
    </div>
    <div>
      <h2>반경 내 주유소 검색</h2>
      <div class="location-controls">
        <div class="location-inputs">
          <label>경도: <input v-model="longitude" type="number" step="0.0001" /></label>
          <label>위도: <input v-model="latitude" type="number" step="0.0001" /></label>
          <label>반경(m): <input v-model="radius" type="number" max="5000" /></label>
        </div>
        <div class="location-actions">
          <button @click="getGasStations" :disabled="isLoading">정보 가져오기</button>
          <button @click="useCurrentLocation" :disabled="isLoading || locationLoading">
            {{ locationLoading ? '위치 가져오는 중...' : '현재 위치 사용하기' }}
          </button>
        </div>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="isLoading">로딩 중...</div>

      <!-- 에러 메시지 -->
      <div v-else-if="error" style="color: red;">{{ error }}</div>

      <!-- 주유소 목록 -->
      <ul v-else-if="gasStations.length > 0">
        <li v-for="station in gasStations" :key="station.UNI_ID">
          <strong>{{ station.OS_NM }}</strong> - 가격: {{ station.PRICE }}원, 거리: {{ station.DISTANCE }}m
        </li>
      </ul>
      <div v-else>주유소가 없습니다.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, provide } from 'vue';
import { fetchLowestPriceFuelStations, FUEL_TYPES } from '@/modules/fuel/api/fuelService';
import FuelStationCard from './FuelStationCard.vue';
import FuelFilter from './FuelFilter.vue';
import FuelListMap from './FuelListMap.vue';
import { getCurrentLocation } from '@/modules/fuel/api/kakaoMobilityService';
import { useGasStationFinder } from '@/modules/fuel/utils/coordinateUtils';

// 상태 정의
const fuelStations = ref([]);
const loading = ref(false);
const error = ref(null);
const selectedFuelType = ref('B027'); // 기본값: 휘발유
const selectedArea = ref('11'); // 기본값: 제주
const fuelListMapRef = ref(null);
const selectedStationId = ref(null);
const userLocation = ref(null);
const locationLoading = ref(false);

// Composable 함수 호출
const { gasStations, isLoading, fetchGasStations } = useGasStationFinder();

// 입력값 (기본값은 나중에 현재 위치로 업데이트됨)
const longitude = ref(null);
const latitude = ref(null);
const radius = ref(5000);        // 반경 (미터)

// 주유소 정보 가져오기 함수
const getGasStations = () => {
    if (longitude.value !== null && latitude.value !== null) {
        fetchGasStations(longitude.value, latitude.value, radius.value);
    }
};

// 현재 위치 사용하기 함수
const useCurrentLocation = async () => {
  locationLoading.value = true;
  try {
    const location = await getCurrentLocation();
    longitude.value = location.longitude;
    latitude.value = location.latitude;
    // 위치 정보를 가져온 후 자동으로 주유소 정보 조회
    getGasStations();
  } catch (error) {
    console.error('사용자 위치를 가져오는데 실패했습니다:', error);
    alert('현재 위치를 가져오는데 실패했습니다. 위치 권한을 확인해주세요.');
    // 위치를 가져오지 못한 경우 기본 좌표 설정 (제주도 중심)
    longitude.value = 126.533594;
    latitude.value = 33.494601;
    getGasStations();
  } finally {
    locationLoading.value = false;
  }
};

// 사용자 현재 위치 가져오기
const fetchUserLocation = async () => {
  locationLoading.value = true;
  try {
    userLocation.value = await getCurrentLocation();
    // 초기 로드 시 현재 위치로 좌표 설정
    longitude.value = userLocation.value.longitude;
    latitude.value = userLocation.value.latitude;
    // 현재 위치 기반으로 주유소 정보 조회
    getGasStations();
  } catch (error) {
    console.error('사용자 위치를 가져오는데 실패했습니다:', error);
    // 위치 정보를 가져오지 못한 경우 기본 좌표로 설정 (제주도 중심)
    longitude.value = 126.533594;
    latitude.value = 33.494601;
    getGasStations();
  } finally {
    locationLoading.value = false;
  }
};

// 주유소 데이터 가져오기
const fetchFuelStations = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    fuelStations.value = await fetchLowestPriceFuelStations(
      selectedFuelType.value, 
      selectedArea.value
    );
    
    // 주유소 데이터를 자식 컴포넌트에 제공
    provide('fuelStations', gasStations.value);
  } catch (err) {
    error.value = err.message || '데이터를 불러올 수 없습니다.';
  } finally {
    loading.value = false;
  }
};

// 주유소 선택 핸들러
const handleStationSelect = (stationId) => {
  selectedStationId.value = stationId;
};

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  fetchFuelStations();
  fetchUserLocation();
});

// 필터 변경 시 데이터 갱신
watch([selectedFuelType, selectedArea], () => {
  fetchFuelStations();
  selectedStationId.value = null; // 필터 변경 시 선택된 주유소 초기화
});
</script>

<style scoped>
.fuel-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
}

.filters {
  margin-bottom: 20px;
}

.map-section {
  margin-bottom: 30px;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading, .error, .empty-result {
  text-align: center;
  padding: 30px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 20px 0;
}

.error {
  color: #dc3545;
}

.fuel-stations-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.location-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.location-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.location-actions {
  display: flex;
  gap: 10px;
}

@media (min-width: 768px) {
  .location-controls {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>