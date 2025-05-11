<template>
  <div class="estate-card">
    <div class="card-header">
      <div class="title-section">
        <h3>{{ estate.aptNm }}</h3>
        <button class="detail-button" @click="showDetail">자세히보기</button>
      </div>
      <p class="address">{{ estate.umdNm }}</p>
    </div>
    <div class="estate-details">
      <div class="detail-item">
        <span class="label">거래금액</span>
        <span class="value">{{ formatAmount(estate.dealAmount) }}만원</span>
      </div>
      <div class="detail-item">
        <span class="label">전용면적</span>
        <span class="value">{{ estate.excluUseAr }}㎡ ({{ convertToKoreanPyeong(estate.excluUseAr) }}평)</span>
      </div>
      <div class="detail-item">
        <span class="label">거래일자</span>
        <span class="value">{{ formatDealDate(estate) }}</span>
      </div>
      <div class="detail-item">
        <span class="label">층수</span>
        <span class="value">{{ estate.floor }}층</span>
      </div>
      <div class="detail-item">
        <span class="label">건축년도</span>
        <span class="value">{{ estate.buildYear }}년</span>
      </div>
      <!-- <div class="detail-item">
        <span class="label">위치 정보</span>
        <span class="value">{{ estate.latitude }}, {{ estate.longitude }}</span>
      </div> -->
    </div>
    <SchoolInfo 
      v-if="hasValidLocation"
      :latitude="parseFloat(estate.latitude)" 
      :longitude="parseFloat(estate.longitude)"
    />
    <HospitalInfo
      v-if="hasValidLocation"
      :latitude="parseFloat(estate.latitude)"
      :longitude="parseFloat(estate.longitude)"
    />
    <div v-else class="no-location">
      위치 정보가 없거나 올바르지 않습니다.
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import SchoolInfo from './SchoolInfo.vue';
import HospitalInfo from './HospitalInfo.vue';
import { realEstateApi } from '@/api/realEstateApi';

const props = defineProps({
  estate: {
    type: Object,
    required: true
  }
});

const router = useRouter();
const currentPage = ref(0);
const itemsPerPage = ref(10);
const estates = ref([]);
const totalPages = ref(0);
const loading = ref(false);
const error = ref(null);

const fetchEstates = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await realEstateApi.fetchRealEstates({
      page: currentPage.value,
      pageSize: itemsPerPage.value
    });
    estates.value = response.realEstates;
    totalPages.value = response.totalPages;
  } catch (err) {
    error.value = '부동산 데이터를 불러오는 중 오류가 발생했습니다.';
    console.error('Error fetching estates:', err);
  } finally {
    loading.value = false;
  }
};

const hasValidLocation = computed(() => {
  const lat = parseFloat(props.estate.latitude);
  const lng = parseFloat(props.estate.longitude);
  
  const isValid = !isNaN(lat) && !isNaN(lng) && 
                 lat >= -90 && lat <= 90 && 
                 lng >= -180 && lng <= 180;
  
  return isValid;
});

const showDetail = () => {
  router.push({
    name: 'RealEstateDetail',
    params: { id: props.estate.jsApRSId }
  });
};

const formatAmount = (amount) => {
  return amount ? amount.toLocaleString() : '0';
};

const convertToKoreanPyeong = (squareMeters) => {
  return (squareMeters / 3.305785).toFixed(2);
};

const formatDealDate = (estate) => {
  return `${estate.dealYear}년 ${estate.dealMonth}월 ${estate.dealDay}일`;
};

onMounted(() => {
  fetchEstates();
});
</script>

<style scoped>
.estate-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.title-section h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.address {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.detail-button {
  display: inline-block;
  padding: 6px 12px;
  background-color: #4c74a6;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: background-color 0.2s;
  border: none;
}

.detail-button:hover {
  background-color: #2980b9;
}

.estate-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.9em;
}

.label {
  color: #666;
  flex-shrink: 0;
  margin-right: 12px;
}

.value {
  color: #2c3e50;
  font-weight: 500;
  text-align: right;
}

.no-location {
  margin-top: 10px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 8px;
  color: #666;
  text-align: center;
  font-style: italic;
}
</style>