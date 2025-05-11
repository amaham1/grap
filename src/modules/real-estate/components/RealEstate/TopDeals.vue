<template>
  <div class="top-deals">
    <h3>{{ formattedDate }} 최고가 거래 TOP 5</h3>
    <div v-if="isLoading" class="loading">
      데이터를 불러오는 중...
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else-if="topDeals.length === 0" class="no-data">
      이번 달 거래 데이터가 없습니다.
    </div>
    <div v-else class="deals-list">
      <div 
        v-for="(deal, index) in topDeals" 
        :key="deal.jsApRSId" 
        class="deal-item"
        @click="navigateToDetail(deal)"
        @mouseenter="hoveredDeal = deal"
        @mouseleave="hoveredDeal = null"
      >
        <div class="rank">{{ index + 1 }}</div>
        <div class="deal-info">
          <div class="apt-name">{{ deal.aptNm }}</div>
          <div class="deal-details">
            <span class="location">{{ deal.umdNm }}</span>
            <span class="amount">{{ formatAmount(deal.dealAmount) }}만원</span>
          </div>
          <div v-if="hoveredDeal === deal" class="deal-date">
            거래일: {{ formatDealDate(deal) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { realEstateApi } from '@/api/realEstateApi';
import { formatAmount } from '@/utils/formatters';
import { formatDate, formatDealDate } from '@/modules/real-estate/utils/dateUtils';

const router = useRouter();
const props = defineProps({
  selectedDate: String // YYYY-MM 형식
});

const hoveredDeal = ref(null);

const formattedDate = computed(() => {
  if (!props.selectedDate) return '';
  return formatDate(props.selectedDate);
});

const navigateToDetail = (estate) => {
  router.push({
    name: 'RealEstateDetail',
    params: { id: estate.jsApRSId }
  });
};

const topDeals = ref([]);

watch(() => props.selectedDate, async (newDate) => {
  try {
    topDeals.value = await realEstateApi.fetchTopDealsByAmount(newDate);
  } catch (error) {
    console.error('거래 데이터 로딩 실패:', error);
    topDeals.value = [];
  }
}, { immediate: true });
</script>

<style scoped>
.top-deals {
  margin-top: 20px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.2em;
}

.deals-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.deal-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border-radius: 8px;
  background: #f8f9fa;
  transition: all 0.2s;
  position: relative;
  cursor: pointer;
}

.deal-item:hover {
  transform: translateX(5px);
  background: #f1f3f5;
}

.rank {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2c3e50;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  margin-right: 15px;
  flex-shrink: 0;
}

.deal-info {
  flex: 1;
}

.apt-name {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 4px;
}

.deal-details {
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 0.9em;
  margin-bottom: 4px;
}

.deal-date {
  font-size: 0.85em;
  color: #2c3e50;
  background: rgba(44, 62, 80, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 4px;
  display: inline-block;
}

.amount {
  color: #4c74a6;
  font-weight: bold;
}

.loading, .error, .no-data {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error {
  color: #dc3545;
}
</style>
