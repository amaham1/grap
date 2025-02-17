<template>
  <div class="real-estate-list">
    <div class="content-wrapper">
      <div class="main-content">
        <h2>부동산 매매 정보</h2>
        <TopDeals 
          v-if="selectedDate" 
          :selectedDate="selectedDate" 
        />
        <div class="search-container">
          <div class="search-box">
            <select 
              v-model="selectedSearchType"
              class="search-type-select"
            >
              <option value="apt_nm">아파트 이름</option>
              <option value="road_nm">도로명 이름</option>
            </select>
            <input 
              type="text" 
              v-model="searchQuery" 
              :placeholder="selectedSearchType === 'apt_nm' ? '아파트 이름으로 검색' : '도로명으로 검색'"
              @keyup.enter="handleSearch"
            >
            <button 
              class="search-button"
              @click="handleSearch"
            >
              검색
            </button>
          </div>
          <div class="filter-container">
            <!-- <select 
              v-model="selectedUmdNm"
              @change="handleFilterChange"
              class="filter-select"
            >
              <option value="">지역 선택</option>
              <option v-for="umdNm in umdNms" :key="umdNm" :value="umdNm">
                {{ umdNm }}
              </option>
            </select> -->

            <select 
              v-model="selectedYear"
              @change="handleFilterChange"
              class="filter-select"
            >
              <option value="">연도 선택</option>
              <option v-for="year in availableYears" :key="year" :value="year">
                {{ year }}년
              </option>
            </select>

            <select 
              v-model="selectedMonth"
              @change="handleFilterChange"
              class="filter-select"
            >
              <option value="">월 선택</option>
              <option v-for="month in availableMonths" :key="month" :value="month">
                {{ month }}월
              </option>
            </select>

            <select 
              v-model="sortType"
              @change="handleFilterChange"
              class="filter-select"
            >
              <option value="">정렬 기준</option>
              <option value="deal_amount">거래금액</option>
              <option value="apt_nm">아파트명</option>
            </select>

            <select 
              v-model="sortOrder"
              @change="handleFilterChange"
              class="filter-select"
              :disabled="!sortType"
            >
              <option value="">정렬 방식</option>
              <option value="asc">오름차순</option>
              <option value="desc">내림차순</option>
            </select>
          </div>
        </div>

        <div v-if="isLoading" class="loading">
          데이터를 불러오는 중...
        </div>
        <div v-else-if="error" class="error">
          {{ error }}
        </div>
        <template v-else>
          <div v-if="realEstates.length > 0" class="list-container">
            <div v-for="estate in realEstates" :key="estate.jsApRSId" class="estate-item">
              <RealEstateCard :estate="estate" />
            </div>
            <div class="pagination-info">
              <div class="total-count">
                검색된 매물 수: {{ realEstates.length }} / 전체 매물 수: {{ totalCount }}
              </div>
              <div class="pagination">
                <button 
                  class="page-button"
                  :disabled="currentPage === 0"
                  @click="handlePageChange(currentPage - 1)"
                >
                  이전
                </button>
                <div class="page-numbers">
                  <button
                    v-for="pageNum in displayedPages"
                    :key="pageNum"
                    class="page-button"
                    :class="{ active: pageNum === currentPage }"
                    @click="handlePageChange(pageNum)"
                  >
                    {{ pageNum + 1 }}
                  </button>
                </div>
                <button 
                  class="page-button"
                  :disabled="currentPage >= totalPages - 1"
                  @click="handlePageChange(currentPage + 1)"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
          <div v-else class="no-data">
            검색된 매물이 없습니다.
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import RealEstateCard from './RealEstateCard.vue';
import TopDeals from './TopDeals.vue';
import { realEstateApi } from '@/api/realEstateApi';
import { formatDate, getPreviousMonth } from '@/utils/dateUtils';

const realEstates = ref([]);
const isLoading = ref(false);
const error = ref(null);
const totalCount = ref(0);
const currentPage = ref(0);
const itemsPerPage = ref(10);
const totalPages = ref(0);

const searchQuery = ref('');
const selectedUmdNm = ref('');
const sortType = ref('');
const sortOrder = ref('');
const selectedSearchType = ref('apt_nm');

const umdNms = ref([]);

const availableYears = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i < 5; i++) {
    years.push(currentYear - i);
  }
  return years;
});

const availableMonths = computed(() => {
  return Array.from({ length: 12 }, (_, i) => i + 1);
});

const displayedPages = computed(() => {
  const pages = [];
  const maxDisplayPages = 5;
  const halfDisplay = Math.floor(maxDisplayPages / 2);
  
  let start = Math.max(currentPage.value - halfDisplay, 0);
  let end = Math.min(start + maxDisplayPages - 1, totalPages.value - 1);
  
  if (end - start + 1 < maxDisplayPages) {
    start = Math.max(end - maxDisplayPages + 1, 0);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});

const selectedDate = computed(() => {
  if (selectedYear.value && selectedMonth.value) {
    const formattedMonth = String(selectedMonth.value).padStart(2, '0');
    return `${selectedYear.value}-${formattedMonth}`;
  }
  return '';
});

// 현재 날짜 기준으로 초기값 설정
const currentDate = new Date();
const currentYear = ref(currentDate.getFullYear());
const currentMonth = ref(currentDate.getMonth() + 1); // 1-12

// 선택된 날짜 상태
const selectedYear = ref(currentYear.value);
const selectedMonth = ref(currentMonth.value);

// 데이터 없을 경우 날짜 조정 함수
const adjustDateIfNoData = (response) => {
  if (
    response.realEstates.length === 0 && 
    selectedYear.value === currentYear.value &&
    selectedMonth.value === currentMonth.value
  ) {
    // 현재 월의 데이터가 없을 경우 한 달 전으로 조정
    if (selectedMonth.value === 1) {
      selectedYear.value -= 1;
      selectedMonth.value = 12;
    } else {
      selectedMonth.value -= 1;
    }
    
    // 조정된 날짜로 재요청 (최대 12개월까지 조정 시도)
    fetchRealEstates();
  }
};

const fetchRealEstates = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const startDate = selectedYear.value 
      ? `${selectedYear.value}-${selectedMonth.value ? String(selectedMonth.value).padStart(2, '0') : '01'}`
      : '';
    const endDate = selectedYear.value 
      ? `${selectedYear.value}-${selectedMonth.value ? String(selectedMonth.value).padStart(2, '0') : '12'}`
      : '';

    const response = await realEstateApi.fetchRealEstates({
      searchQuery: searchQuery.value,
      searchType: selectedSearchType.value,
      umdNm: selectedUmdNm.value,
      startDate,
      endDate,
      sortType: sortType.value,
      sortOrder: sortOrder.value,
      itemNum: currentPage.value,
      itemSizePerPage: itemsPerPage.value
    });

    // 데이터 없을 경우 날짜 자동 조정
    adjustDateIfNoData(response);
    
    // 응답이 없거나 realEstates 배열이 없는 경우 기본값 설정
    realEstates.value = response?.realEstates || [];
    totalCount.value = response?.totalCount || 0;
    totalPages.value = response?.totalPages || 0;
    
    // 현재 페이지에 데이터가 없고, 첫 페이지가 아닌 경우 이전 페이지로 이동
    if (realEstates.value.length === 0 && currentPage.value > 0) {
      currentPage.value = Math.max(0, currentPage.value - 1);
      await fetchRealEstates();
    }
  } catch (err) {
    console.error('Error fetching real estates:', err);
    error.value = '부동산 데이터를 불러오는 중 오류가 발생했습니다.';
    realEstates.value = [];
    totalCount.value = 0;
    totalPages.value = 0;
  } finally {
    isLoading.value = false;
  }
};

const handlePageChange = (page) => {
  console.log('Page change requested:', page);
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page;
    fetchRealEstates();
  }
};

const handleSearch = () => {
  // 검색 버튼 클릭 시에만 검색어 유효성 검사
  if (!searchQuery.value.trim()) {
    alert('검색어를 입력해주세요.');
    return;
  }
  
  // 년/월 선택 초기화
  selectedYear.value = '';
  selectedMonth.value = '';
  
  // 페이지 초기화
  currentPage.value = 0;
  fetchRealEstates();
};

const handleFilterChange = () => {
  currentPage.value = 0;
  fetchRealEstates();
};

watch(selectedYear, (newValue) => {
  if (newValue) {
    handleFilterChange();
  }
});

watch(selectedMonth, (newValue) => {
  if (selectedYear.value) {
    handleFilterChange();
  }
});

watch([selectedUmdNm, sortType, sortOrder, selectedSearchType], () => {
  handleFilterChange();
});

onMounted(async () => {
  await fetchRealEstates();
});
</script>

<style scoped>
.real-estate-list {
  margin: 0 auto;
}

.search-container {
  margin: 20px 0;
}

.search-box {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
}

.search-type-select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.search-box input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.search-button {
  padding: 8px 16px;
  background-color: #4c74a6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-button:hover {
  background-color: #2980b9;
}

.filter-container {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.filter-select {
  flex: 1;
  min-width: 150px;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1em;
  outline: none;
  transition: border-color 0.2s;
  background-color: white;
  cursor: pointer;
}

.filter-select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.filter-select:focus {
  border-color: #2c3e50;
}

.list-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
  margin-bottom: 50px;
}

.pagination-info {
  grid-column: 1 / -1;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.total-count {
  text-align: right;
  color: #666;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.page-numbers {
  display: flex;
  gap: 5px;
}

.page-button {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.page-button:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.page-button.active {
  background: #2c3e50;
  color: white;
  border-color: #2c3e50;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading, .error, .no-data {
  text-align: center;
  padding: 40px;
  color: #666;
  background: white;
  border-radius: 8px;
  margin-top: 20px;
}

.error {
  color: #dc3545;
}

.content-wrapper {
  display: flex;
  gap: 20px;
}

.main-content {
  flex: 1;
}

@media (max-width: 1024px) {
  .content-wrapper {
    flex-direction: column;
  }
  
}
</style>
