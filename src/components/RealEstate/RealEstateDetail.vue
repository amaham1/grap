<template>
  <div class="real-estate-detail">
    <div v-if="isLoading" class="loading">
      <div class="loading-spinner"></div>
      부동산 정보를 불러오는 중...
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else class="detail-content">
      <!-- 기본 정보 섹션 -->
      <section class="basic-info">
        <h2>{{ property.aptNm }}</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">거래금액</span>
            <span class="value">{{ formatPrice(property.dealAmount) }}만원</span>
          </div>
          <div class="info-item">
            <span class="label">전용면적</span>
            <span class="value">{{ property.excluUseAr }}㎡ ({{ convertToKoreanPyeong(property.excluUseAr) }}평)</span>
          </div>
          <div class="info-item">
            <span class="label">건축년도</span>
            <span class="value">{{ property.buildYear }}년</span>
          </div>
          <div class="info-item">
            <span class="label">층수</span>
            <span class="value">{{ property.floor }}층</span>
          </div>
          <div class="info-item">
            <span class="label">최근 거래일</span>
            <span class="value">{{ formatDate(property.dealYear, property.dealMonth, property.dealDay) }}</span>
          </div>
          <div class="info-item">
            <span class="label">지역(도로명)</span>
            <span class="value">{{ property.umdNm }} ({{ property.roadNm }})</span>
          </div>
        </div>
      </section>

      <!-- 시세 차트 섹션 -->
      <div class="price-chart-section">
        <div class="chart-header">
          <h3>거래 시세</h3>
          <div class="year-selector">
            <label for="yearSelect">시작 연도:</label>
            <select 
              id="yearSelect" 
              v-model="selectedYear"
              class="year-select"
            >
              <option 
                v-for="year in availableYears" 
                :key="year" 
                :value="year"
              >
                {{ year }}년부터 현재까지
              </option>
            </select>
          </div>
        </div>
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        <div v-else-if="priceHistory.length === 0" class="no-data">
          선택하신 기간의 시세 데이터가 없습니다.
        </div>
        <PriceChart v-else :price-data="priceHistory" />
      </div>

      <!-- 지도 섹션 -->
      <KakaoMap
        v-if="property && property.latitude && property.longitude"
        :key="mapKey"
        :latitude="Number(property.latitude)"
        :longitude="Number(property.longitude)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { realEstateApi } from '@/api/realEstateApi';
import KakaoMap from '@/components/Map/KakaoMap.vue';
import PriceChart from './PriceChart.vue';

const props = defineProps({
  propertyId: {
    type: Number,
    required: true
  }
});

const property = ref(null);
const priceHistory = ref([]);
const isLoading = ref(true);
const error = ref(null);
const selectedYear = ref(new Date().getFullYear());
const autoSearchedYear = ref(null);

// 선택 가능한 연도 목록 생성 (현재 연도부터 과거 5년)
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i < 5; i++) {
    years.push(currentYear - i);
  }
  return years;
});

const formatPrice = (price) => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatDate = (year, month, day) => {
  return `${year}년 ${month}월 ${day}일`;
};

// 제곱미터를 평으로 변환하는 함수
const convertToKoreanPyeong = (squareMeters) => {
  return (squareMeters / 3.305785).toFixed(2);
};

const fetchPriceHistory = async (year = selectedYear.value, autoSearch = false) => {
  try {
    if (!autoSearch) {
      isLoading.value = true;
    }
    error.value = null;

    // 현재 날짜를 endDate로 설정
    const endDate = new Date();
    // 선택된 연도의 1월 1일을 startDate로 설정
    const startDate = new Date(year, 0, 1);

    // 선택된 연도가 현재 연도보다 미래인 경우 에러 처리
    if (year > endDate.getFullYear()) {
      error.value = '미래 연도의 데이터는 조회할 수 없습니다.';
      priceHistory.value = [];
      return false;
    }

    const formattedStartDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
    const formattedEndDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;

    console.log('조회 기간:', {
      시작일: formattedStartDate,
      종료일: formattedEndDate,
      자동검색: autoSearch
    });

    const response = await realEstateApi.fetchPriceHistory({
      jsApRSId: props.propertyId,
      aptSeq: property.value?.aptSeq,
      floor: property.value?.floor,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      itemSizePerPage: 500
    });

    if (response && response.realEstates && response.realEstates.length > 0) {
      priceHistory.value = response.realEstates.map(item => ({
        date: `${item.dealYear}-${String(item.dealMonth).padStart(2, '0')}-${String(item.dealDay).padStart(2, '0')}`,
        avgPrice: item.dealAmount
      }));

      priceHistory.value.sort((a, b) => a.date.localeCompare(b.date));

      // 데이터를 찾았으면 자동 검색 중이었다면 해당 연도를 저장
      if (autoSearch) {
        autoSearchedYear.value = year;
        selectedYear.value = year;
      }
      
      // 지도 강제 리렌더링
      mapKey.value++;
      
      return true;
    } else {
      console.warn('시세 데이터가 없거나 잘못된 형식입니다:', response);
      if (!autoSearch) {
        priceHistory.value = [];
      }
      return false;
    }
    
  } catch (err) {
    error.value = '시세 데이터를 불러오는 중 오류가 발생했습니다.';
    console.error('Error fetching price history:', err);
    if (!autoSearch) {
      priceHistory.value = [];
    }
    return false;
  } finally {
    if (!autoSearch) {
      isLoading.value = false;
    }
  }
};

const findDataInPreviousYears = async () => {
  const currentYear = new Date().getFullYear();
  
  // 현재 연도부터 5년 전까지 순차적으로 검색
  for (let year = currentYear; year >= currentYear - 5; year--) {
    const found = await fetchPriceHistory(year, true);
    if (found) {
      isLoading.value = false;
      return;
    }
  }

  // 데이터를 찾지 못한 경우
  error.value = '최근 5년간의 시세 데이터가 없습니다.';
  priceHistory.value = [];
  isLoading.value = false;
};

const fetchData = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    // 부동산 상세 정보 조회
    const response = await realEstateApi.fetchRealEstateDetail(props.propertyId);
    property.value = response;

    // 시세 데이터 조회 시작
    await findDataInPreviousYears();

  } catch (err) {
    error.value = '데이터를 불러오는 중 오류가 발생했습니다.';
    console.error('Error fetching data:', err);
  } finally {
    isLoading.value = false;
  }
};

// 지도 강제 리렌더링을 위한 key
const mapKey = ref(0);

// 연도가 변경될 때마다 시세 데이터 다시 조회
watch(() => selectedYear.value, async (newYear) => {
  await fetchPriceHistory(newYear);
});

// propertyId가 변경될 때마다 데이터 다시 조회
watch(() => props.propertyId, () => {
  fetchData();
});

// 초기 데이터 로드
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.real-estate-detail {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loading {
  text-align: center;
  padding: 1rem;
  color: #666;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #dc3545;
  padding: 0.5rem;
  text-align: center;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.basic-info h2 {
  font-size: 1.8rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.9rem;
  color: #666;
}

.value {
  font-size: 1.1rem;
  color: #2c3e50;
  font-weight: 500;
}

.no-data {
  text-align: center;
  padding: 2rem;
  color: #666;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.year-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.year-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  color: #2c3e50;
  background-color: white;
  cursor: pointer;
}

.year-select:hover {
  border-color: #3498db;
}

.year-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.error-message {
  color: #dc3545;
  padding: 1rem;
  background-color: #f8d7da;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.auto-search-notice {
  color: #666;
  font-size: 0.9rem;
}

.map-section {
  margin: 20px 0;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.map-container {
  width: 100%;
  height: 400px;
  margin-top: 10px;
  border-radius: 4px;
  position: relative;
  z-index: 1;
}
</style>
