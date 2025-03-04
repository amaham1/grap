<template>
  <div class="fuel-filter">
    <div class="filter-group">
      <label for="fuel-type">유류 종류:</label>
      <select 
        id="fuel-type" 
        v-model="localFuelType"
        @change="updateFuelType" 
        class="filter-select"
      >
        <option 
          v-for="fuelType in fuelTypes" 
          :key="fuelType.value" 
          :value="fuelType.value"
        >
          {{ fuelType.label }}
        </option>
      </select>
    </div>
    
    <div class="filter-group">
      <label for="area">지역:</label>
      <select 
        id="area" 
        v-model="localArea" 
        @change="updateArea" 
        class="filter-select"
      >
        <option 
          v-for="area in areas" 
          :key="area.value" 
          :value="area.value"
        >
          {{ area.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted, watch } from 'vue';
import { FUEL_TYPES, AREA_CODES } from '@/modules/fuel/api/fuelService';

const props = defineProps({
  selectedFuelType: {
    type: String,
    default: 'B027' // 기본값: 휘발유
  },
  selectedArea: {
    type: String,
    default: '11' // 기본값: 제주
  }
});

const emit = defineEmits(['update:selected-fuel-type', 'update:selected-area']);

// 로컬 상태 설정
const localFuelType = ref(props.selectedFuelType);
const localArea = ref(props.selectedArea);

// 상수 데이터
const fuelTypes = FUEL_TYPES;
const areas = AREA_CODES;

// 부모 컴포넌트에 이벤트 전달
const updateFuelType = () => {
  emit('update:selected-fuel-type', localFuelType.value);
};

const updateArea = () => {
  emit('update:selected-area', localArea.value);
};

// props 변경 시 로컬 상태 업데이트
watch(() => props.selectedFuelType, (newValue) => {
  localFuelType.value = newValue;
});

watch(() => props.selectedArea, (newValue) => {
  localArea.value = newValue;
});

// 컴포넌트 마운트 시 초기화
onMounted(() => {
  localFuelType.value = props.selectedFuelType;
  localArea.value = props.selectedArea;
});
</script>

<style scoped>
.fuel-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 200px;
}

.filter-group label {
  font-weight: 500;
  margin-bottom: 8px;
  color: #495057;
}

.filter-select {
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background-color: white;
  font-size: 16px;
}

.filter-select:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}
</style>
