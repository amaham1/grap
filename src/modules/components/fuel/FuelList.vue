<template>
  <div class="fuel-list-container">
    <div class="title-section">
      <h1 class="title">반경 내 주유소 정보</h1>
      <button @click="showLowestPriceStations" class="lowest-price-btn">
        <i class="price-icon">💰</i> 이 지역 최저가 주유소(Top20)
      </button>
    </div>
    
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
        v-for="(station, index) in visibleStations" 
        :key="station.UNI_ID" 
        :station="station"
        :allStations="gasStations"
        :selected="selectedStationId === station.UNI_ID"
        :userLocation="userLocation"
        @select-station="handleStationSelect"
      />
      
      <div v-if="hasMoreStations" class="show-more-container">
        <button @click="showMoreStations" class="show-more-btn">
          더보기 ({{ gasStations.length - visibleStations.length }}개 더)
        </button>
      </div>
    </div>
    <div>
      <h2>반경 내 주유소 검색</h2>
      <div class="location-controls">
        <div class="location-inputs">
          <div class="input-group">
            <label>경도: <input v-model="longitude" type="number" step="0.0001" /></label>
            <label>위도: <input v-model="latitude" type="number" step="0.0001" /></label>
          </div>
          <div class="input-group">
            <label>반경(m): <input v-model="radius" type="number" max="5000" /></label>
            <button @click="openDaumAddressSearch" class="address-search-btn">
              <i class="search-icon">🔍</i> 주소 검색
            </button>
          </div>
        </div>
        <div class="location-actions">
          <button @click="getGasStations" :disabled="isLoading" class="action-btn">정보 가져오기</button>
          <button @click="useCurrentLocation" :disabled="isLoading || locationLoading" class="action-btn">
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
import { ref, onMounted, watch, provide, computed } from 'vue';
import { fetchLowestPriceFuelStations, FUEL_TYPES } from '@/modules/fuel/api/fuelService';
import FuelStationCard from './FuelStationCard.vue';
import FuelFilter from './FuelFilter.vue';
import FuelListMap from './FuelListMap.vue';
import { getCurrentLocation } from '@/modules/fuel/api/kakaoMobilityService';
import { useGasStationFinder } from '@/modules/fuel/utils/coordinateUtils';
import { initKakaoMap } from '@/api/kakaoMapApi';

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

// 더보기 기능을 위한 상태
const visibleCount = ref(6); // 처음에 보여줄 카드 개수

// 현재 보이는 주유소 목록 (computed)
const visibleStations = computed(() => {
  return gasStations.value.slice(0, visibleCount.value);
});

// 더 보여줄 주유소가 있는지 확인 (computed)
const hasMoreStations = computed(() => {
  return visibleCount.value < gasStations.value.length;
});

// 더보기 버튼 클릭 시 실행할 함수
const showMoreStations = () => {
  // 모든 주유소를 보여주도록 설정
  visibleCount.value = gasStations.value.length;
};

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
        // 새로운 검색 결과가 로드되면 보이는 주유소 개수 초기화
        visibleCount.value = 6;
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

// 다음(Daum) 주소 검색 팝업 열기
const openDaumAddressSearch = async () => {
  try {
    // 카카오 맵 API 초기화 (주소 검색에 필요)
    await initKakaoMap();
    
    // 다음 주소 검색 스크립트가 로드되어 있는지 확인
    if (!window.daum || !window.daum.postcode) {
      // 스크립트 동적 로드
      const script = document.createElement('script');
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.onload = initDaumAddressSearch;
      document.head.appendChild(script);
    } else {
      initDaumAddressSearch();
    }
  } catch (error) {
    console.error('카카오 맵 API 초기화 중 오류 발생:', error);
    alert('주소 검색을 위한 API 초기화에 실패했습니다.');
  }
};

// 다음(Daum) 주소 검색 초기화
const initDaumAddressSearch = () => {
  new window.daum.Postcode({
    oncomplete: function(data) {
      // 선택한 주소 정보
      const address = data.address;
      
      // 카카오 지도 API를 사용하여 주소를 좌표로 변환
      if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
        const geocoder = new window.kakao.maps.services.Geocoder();
        
        geocoder.addressSearch(address, function(result, status) {
          if (status === window.kakao.maps.services.Status.OK) {
            const coords = result[0];
            
            // 위경도 값 설정
            longitude.value = parseFloat(coords.x);
            latitude.value = parseFloat(coords.y);
            
            // 자동으로 주유소 정보 조회
            getGasStations();
          } else {
            alert('주소를 좌표로 변환하는데 실패했습니다.');
          }
        });
      } else {
        alert('카카오 지도 API가 로드되지 않았습니다.');
      }
    },
    width: '100%',
    height: '100%'
  }).open();
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

// 최저가 주유소 표시 핸들러
const showLowestPriceStations = async () => {
  try {
    const lowestPriceStations = await fetchLowestPriceFuelStations(
      selectedFuelType.value, 
      selectedArea.value
    );
    
    // 카카오 맵에 최저가 주유소 표시
    fuelListMapRef.value.showLowestPriceStations(lowestPriceStations);
  } catch (error) {
    console.error('최저가 주유소를 가져오는데 실패했습니다:', error);
  }
};

// 컴포넌트 마운트 시 데이터 로드
onMounted(async () => {
  // 카카오 맵 API 초기화
  try {
    await initKakaoMap();
  } catch (error) {
    console.error('카카오 맵 API 초기화 중 오류 발생:', error);
  }
  
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

.title-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
}

.lowest-price-btn {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
}

.lowest-price-btn:hover {
  background-color: #0056b3;
}

.price-icon {
  margin-right: 5px;
  font-size: 16px;
}

.filters {
  margin-bottom: 20px;
}

.map-section {
  margin-bottom: 30px;
  height: 600px;
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
  gap: 15px;
  margin-bottom: 20px;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.location-inputs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.location-inputs label {
  display: flex;
  align-items: center;
  font-weight: 500;
  margin-right: 10px;
}

.location-inputs input {
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  margin-left: 5px;
  width: 120px;
}

.location-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.action-btn {
  padding: 10px 15px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: #218838;
}

.action-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.address-search-btn {
  background-color: #007bff;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
}

.address-search-btn:hover {
  background-color: #0056b3;
}

.search-icon {
  margin-right: 5px;
  font-size: 16px;
}

.show-more-container {
  text-align: center;
  margin-top: 20px;
}

.show-more-btn {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.show-more-btn:hover {
  background-color: #0056b3;
}

@media (min-width: 768px) {
  .location-controls {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  .location-inputs {
    flex: 1;
  }
  
  .location-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>