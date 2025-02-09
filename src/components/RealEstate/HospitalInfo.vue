<template>
  <div class="hospital-info">
    <div v-if="isLoading" class="loading">
      <div class="loading-spinner"></div>
      주변 병원 정보를 불러오는 중...
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else>
      <div class="hospital-count">
        반경 1km 내 병원: {{ hospitalCount }}개
      </div>
      <div v-if="showDetail && hospitals.length > 0" class="hospital-list">
        <div v-for="hospital in hospitals" :key="hospital.id" class="hospital-item">
          <div class="hospital-name">{{ hospital.place_name }}</div>
          <div class="hospital-distance">{{ formatDistance(hospital.distance) }}</div>
        </div>
      </div>
      <button 
        v-if="hospitals.length > 0" 
        class="toggle-detail" 
        @click="showDetail = !showDetail"
      >
        {{ showDetail ? '간단히 보기' : '자세히 보기' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watchEffect } from 'vue';
import { searchNearbyHospitals } from '@/api/kakaoMapApi';

const props = defineProps({
  latitude: {
    type: Number,
    required: true,
    validator: value => !isNaN(value) && value >= -90 && value <= 90
  },
  longitude: {
    type: Number,
    required: true,
    validator: value => !isNaN(value) && value >= -180 && value <= 180
  }
});

const hospitalCount = ref(0);
const hospitals = ref([]);
const isLoading = ref(false);
const error = ref(null);
const showDetail = ref(false);

const formatDistance = (meters) => {
  return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
};

const fetchHospitalInfo = async () => {
  if (!props.latitude || !props.longitude) {
    error.value = '위치 정보가 없습니다.';
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;
    
    const result = await searchNearbyHospitals(props.latitude, props.longitude);
    
    hospitals.value = result;
    hospitalCount.value = result.length;
  } catch (err) {
    console.error('Error in fetchHospitalInfo:', err);
    error.value = '병원 정보를 불러오는데 실패했습니다. ' + (err.message || '');
  } finally {
    isLoading.value = false;
  }
};

// watchEffect를 사용하여 props 변경 감지
watchEffect(() => {
  const lat = props.latitude;
  const lng = props.longitude;
  
  if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
    fetchHospitalInfo();
  }
});

</script>

<style scoped>
.hospital-info {
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

.hospital-count {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 1rem;
  color: #333;
}

.hospital-list {
  margin-top: 1rem;
}

.hospital-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
}

.hospital-item:last-child {
  border-bottom: none;
}

.hospital-name {
  font-weight: 500;
  color: #333;
}

.hospital-distance {
  color: #666;
  font-size: 0.9rem;
}

.toggle-detail {
  width: 100%;
  padding: 0.5rem;
  margin-top: 1rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #495057;
  transition: all 0.2s ease;
}

.toggle-detail:hover {
  background-color: #e9ecef;
}
</style>
