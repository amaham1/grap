<template>
  <div class="price-history">
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import Chart from 'chart.js/auto';
import { formatDate } from '@/utils/dateUtils';

const props = defineProps({
  priceData: {
    type: Array,
    required: true
  }
});

const chartCanvas = ref(null);
let chart = null;

const createChart = () => {
  if (!chartCanvas.value) return;

  const ctx = chartCanvas.value.getContext('2d');
  
  if (chart) {
    chart.destroy();
  }

  // 월별로 데이터 그룹화
  const monthlyData = props.priceData.reduce((acc, item) => {
    const monthKey = item.date.substring(0, 7); // YYYY-MM 형식으로 추출
    if (!acc[monthKey]) {
      acc[monthKey] = {
        sum: 0,
        count: 0
      };
    }
    acc[monthKey].sum += item.avgPrice;
    acc[monthKey].count += 1;
    return acc;
  }, {});

  // 월별 평균 계산
  const monthlyAverages = Object.entries(monthlyData).map(([month, data]) => ({
    date: month,
    avgPrice: data.sum / data.count
  })).sort((a, b) => a.date.localeCompare(b.date));

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthlyAverages.map(item => formatDate(item.date)),
      datasets: [{
        label: '평균 거래가',
        data: monthlyAverages.map(item => item.avgPrice),
        borderColor: '#4c74a6',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value.toLocaleString() + '만원';
            }
          }
        }
      }
    }
  });
};

// priceData가 변경될 때마다 차트 업데이트
watch(() => props.priceData, () => {
  createChart();
}, { deep: true });

onMounted(() => {
  createChart();
});
</script>

<style scoped>
.price-history {
  margin-top: 2rem;
}

.price-history h3 {
  font-size: 1.4rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
}
</style>
