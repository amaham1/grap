<template>
  <div class="school-info">
    <div v-if="isLoading" class="loading">
      <div class="loading-spinner"></div>
      주변 학교 정보를 불러오는 중...
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else>
      <div class="school-count">
        반경 1km 내 초등학교: {{ schoolCount }}개
      </div>
      <div v-if="showDetail && schools.length > 0" class="school-list">
        <div 
          v-for="school in schools" 
          :key="school.name" 
          class="school-item"
          @click="handleMapClick(school)"
        >
          <div class="school-name">{{ school.name }}</div>
          <div class="school-distance">{{ formatDistance(school.distance) }}</div>
        </div>
      </div>
      <button 
        v-if="schools.length > 0" 
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
import { searchNearbySchools } from '@/api/kakaoMapApi';
import { openKakaoMap } from '@/utils/kakaoMap';
import { formatDistance } from '@/utils/formatters';

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

const schoolCount = ref(0);
const schools = ref([]);
const isLoading = ref(false);
const error = ref(null);
const showDetail = ref(false);

const handleMapClick = (school) => {
  openKakaoMap(school.name);
};

const fetchSchoolInfo = async () => {
  if (!props.latitude || !props.longitude) {
    error.value = '위치 정보가 없습니다.';
    return;
  }

  try {
    isLoading.value = true;
    error.value = null;
    
    const result = await searchNearbySchools(props.latitude, props.longitude);
    
    schoolCount.value = result.count;
    schools.value = result.schools;
  } catch (err) {
    console.error('Error in fetchSchoolInfo:', err);
    error.value = '학교 정보를 불러오는데 실패했습니다. ' + (err.message || '');
  } finally {
    isLoading.value = false;
  }
};

// watchEffect를 사용하여 props 변경 감지
watchEffect(() => {
  const lat = props.latitude;
  const lng = props.longitude;
  
  if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
    fetchSchoolInfo();
  }
});
</script>

<style scoped>
.school-info {
  margin-top: 10px;
  padding: 10px;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.school-count {
  font-weight: bold;
  color: #2c3e50;
}

.school-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.school-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin-bottom: 8px;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.school-item:hover {
  background-color: #f0f0f0;
}

.school-name {
  font-weight: 500;
}

.school-distance {
  color: #666;
  font-size: 0.9em;
}

.toggle-detail {
  margin-top: 10px;
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 0.9em;
}

.toggle-detail:hover {
  background: #f1f3f5;
}

.loading {
  color: #666;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #dc3545;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #f5c6cb;
}
</style>
