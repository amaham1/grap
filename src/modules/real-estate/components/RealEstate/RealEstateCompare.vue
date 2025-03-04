<template>
  <div class="real-estate-compare">
    <h2 class="compare-title">부동산 매매 비교</h2>
    <div class="compare-container">
      <!-- 첫 번째 부동산 선택 영역 -->
      <div class="estate-selection">
        <h3>첫 번째 부동산 선택</h3>
        <div class="search-box">
          <input 
            v-model="searchQuery1" 
            type="text" 
            placeholder="아파트명으로 검색 (최소 2글자 이상)"
            @input="handleSearch1"
          />
          <div v-if="error1" class="error-message">{{ error1 }}</div>
        </div>
        <div 
          v-if="searchResults1?.length > 0" 
          class="search-results"
        >
          <div 
            v-for="estate in searchResults1" 
            :key="estate.jsApRSId"
            class="search-item"
            @click="selectEstate(estate, true)"
          >
            <div class="estate-name">{{ estate.aptNm }}</div>
            <div class="estate-info">
              <div class="info-row">
                <span class="location">{{ estate.umdNm }}</span>
                <span class="price">{{ formatAmount(estate.dealAmount) }}만원</span>
              </div>
              <div class="info-row">
                <span class="deal-date">{{ formatDealDate(estate) }}</span>
                <span class="floor">{{ estate.floor }}층</span>
                <span class="area">{{ Math.round(estate.excluUseAr * 0.3025) }}평 ({{ estate.excluUseAr }}㎡)</span>
              </div>
            </div>
          </div>
          <div 
            class="scroll-observer"
            ref="observer1"
          ></div>
          <div v-if="loading1" class="loading-indicator">
            <div class="loading-spinner"></div>
            <span>검색 중...</span>
          </div>
          <div v-if="!hasMore1 && searchResults1.length > 0" class="no-more-data">
            더 이상 검색 결과가 없습니다.
          </div>
        </div>
        <div v-if="selectedEstate1" class="selected-estate">
          <div class="estate-details">
            <h4>{{ selectedEstate1.aptNm }}</h4>
            <p>{{ selectedEstate1.umdNm }}</p>
            <p>{{ formatAmount(selectedEstate1.dealAmount) }}만원</p>
            <p>{{ formatDealDate(selectedEstate1) }}</p>
          </div>
          <button @click="clearSelection()" class="change-button">변경</button>
        </div>
      </div>

      <!-- 두 번째 부동산 선택 영역 -->
      <div class="estate-selection">
        <h3>두 번째 부동산 선택</h3>
        <div class="search-box">
          <input 
            v-model="searchQuery2" 
            type="text" 
            placeholder="아파트명으로 검색 (최소 2글자 이상)"
            @input="handleSearch2"
          />
          <div v-if="error2" class="error-message">{{ error2 }}</div>
        </div>
        <div 
          v-if="searchResults2?.length > 0" 
          class="search-results"
        >
          <div 
            v-for="estate in searchResults2" 
            :key="estate.jsApRSId"
            class="search-item"
            @click="selectEstate(estate, false)"
          >
            <div class="estate-name">{{ estate.aptNm }}</div>
            <div class="estate-info">
              <div class="info-row">
                <span class="location">{{ estate.umdNm }}</span>
                <span class="price">{{ formatAmount(estate.dealAmount) }}만원</span>
              </div>
              <div class="info-row">
                <span class="deal-date">{{ formatDealDate(estate) }}</span>
                <span class="floor">{{ estate.floor }}층</span>
                <span class="area">{{ Math.round(estate.excluUseAr * 0.3025) }}평 ({{ estate.excluUseAr }}㎡)</span>
              </div>
            </div>
          </div>
          <div 
            class="scroll-observer"
            ref="observer2"
          ></div>
          <div v-if="loading2" class="loading-indicator">
            <div class="loading-spinner"></div>
            <span>검색 중...</span>
          </div>
          <div v-if="!hasMore2 && searchResults2.length > 0" class="no-more-data">
            더 이상 검색 결과가 없습니다.
          </div>
        </div>
        <div v-if="selectedEstate2" class="selected-estate">
          <div class="estate-details">
            <h4>{{ selectedEstate2.aptNm }}</h4>
            <p>{{ selectedEstate2.umdNm }}</p>
            <p>{{ formatAmount(selectedEstate2.dealAmount) }}만원</p>
            <p>{{ formatDealDate(selectedEstate2) }}</p>
          </div>
          <button @click="clearSelection(false)" class="change-button">변경</button>
        </div>
      </div>
    </div>

    <!-- 비교 결과 -->
    <div v-if="selectedEstate1 && selectedEstate2" class="comparison-results">
      <h3>비교 결과</h3>
      <div class="comparison-table">
        <div class="comparison-row">
          <div class="label">항목</div>
          <div class="value">{{ selectedEstate1.aptNm }}</div>
          <div class="value">{{ selectedEstate2.aptNm }}</div>
        </div>
        <div class="comparison-row">
          <div class="label">위치</div>
          <div class="value">{{ selectedEstate1.umdNm }}</div>
          <div class="value">{{ selectedEstate2.umdNm }}</div>
        </div>
        <div class="comparison-row">
          <div class="label">거래금액</div>
          <div class="value">
            {{ formatAmount(selectedEstate1.dealAmount) }}만원
            <span 
              v-if="selectedEstate1.dealAmount > selectedEstate2.dealAmount" 
              class="difference higher"
            >
              (↑{{ calculatePercentage(selectedEstate1.dealAmount, selectedEstate2.dealAmount) }}%)
            </span>
          </div>
          <div class="value">
            {{ formatAmount(selectedEstate2.dealAmount) }}만원
            <span 
              v-if="selectedEstate2.dealAmount > selectedEstate1.dealAmount" 
              class="difference higher"
            >
              (↑{{ calculatePercentage(selectedEstate2.dealAmount, selectedEstate1.dealAmount) }}%)
            </span>
          </div>
        </div>
        <div class="comparison-row">
          <div class="label">전용면적</div>
          <div class="value">
            {{ selectedEstate1.excluUseAr }}㎡
            <span 
              v-if="selectedEstate1.excluUseAr > selectedEstate2.excluUseAr" 
              class="difference higher"
            >
              (↑{{ calculatePercentage(selectedEstate1.excluUseAr, selectedEstate2.excluUseAr) }}%)
            </span>
          </div>
          <div class="value">
            {{ selectedEstate2.excluUseAr }}㎡
            <span 
              v-if="selectedEstate2.excluUseAr > selectedEstate1.excluUseAr" 
              class="difference higher"
            >
              (↑{{ calculatePercentage(selectedEstate2.excluUseAr, selectedEstate1.excluUseAr) }}%)
            </span>
          </div>
        </div>
        <div class="comparison-row">
          <div class="label">준공년도</div>
          <div class="value">
            {{ selectedEstate1.buildYear }}년
            <span 
              v-if="selectedEstate1.buildYear > selectedEstate2.buildYear" 
              class="difference newer"
            >
              최근 건물
            </span>
          </div>
          <div class="value">
            {{ selectedEstate2.buildYear }}년
            <span 
              v-if="selectedEstate2.buildYear > selectedEstate1.buildYear" 
              class="difference newer"
            >
              최근 건물
            </span>
          </div>
        </div>
        <div class="comparison-row">
          <div class="label">거래일</div>
          <div class="value">{{ formatDealDate(selectedEstate1) }}</div>
          <div class="value">{{ formatDealDate(selectedEstate2) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { formatAmount } from '@/modules/real-estate/utils/formatters';
import { formatDealDate } from '@/modules/real-estate/utils/dateUtils';
import { realEstateApi } from '@/api/realEstateApi';
import { debounce } from 'lodash';

// 검색 관련 상태
const searchQuery1 = ref('');
const searchQuery2 = ref('');
const searchResults1 = ref([]);
const searchResults2 = ref([]);
const selectedEstate1 = ref(null);
const selectedEstate2 = ref(null);
const loading1 = ref(false);
const loading2 = ref(false);
const error1 = ref(null);
const error2 = ref(null);
const currentPage1 = ref(0);
const currentPage2 = ref(0);
const hasMore1 = ref(true);
const hasMore2 = ref(true);
const itemsPerPage = 10;

// 검색 상태 플래그 추가
const isUserSearching1 = ref(false);
const isUserSearching2 = ref(false);

// Intersection Observer refs
const observer1 = ref(null);
const observer2 = ref(null);

// 검색어 변경 감지
watch(searchQuery1, (newQuery) => {
  if (isUserSearching1.value && newQuery && newQuery.length >= 2) {
    debouncedSearch1();
  }
}, { immediate: true });

watch(searchQuery2, (newQuery) => {
  if (isUserSearching2.value && newQuery && newQuery.length >= 2) {
    debouncedSearch2();
  }
}, { immediate: true });

// 검색 핸들러 함수
const handleSearch1 = (e) => {
  isUserSearching1.value = true;
  searchQuery1.value = e.target.value;
};

const handleSearch2 = (e) => {
  isUserSearching2.value = true;
  searchQuery2.value = e.target.value;
};

// 디바운스된 검색 함수
const debouncedSearch1 = debounce(() => {
  if (searchQuery1.value && searchQuery1.value.length >= 2) {
    search(searchQuery1.value, true);
  }
}, 500);

const debouncedSearch2 = debounce(() => {
  if (searchQuery2.value && searchQuery2.value.length >= 2) {
    search(searchQuery2.value, false);
  }
}, 500);

// 검색 함수
const search = async (query, isFirstSearch = true) => {
  if (!query || query.length < 2) {
    if (isFirstSearch) {
      searchResults1.value = [];
      hasMore1.value = true;
      currentPage1.value = 0;
    } else {
      searchResults2.value = [];
      hasMore2.value = true;
      currentPage2.value = 0;
    }
    return;
  }

  try {
    if (isFirstSearch) {
      loading1.value = true;
      error1.value = null;
    } else {
      loading2.value = true;
      error2.value = null;
    }

    const response = await realEstateApi.fetchRealEstates({
      searchKey: query,
      searchType: 'apt_nm',
      itemNum: 0,
      itemSizePerPage: itemsPerPage
    });

    if (isFirstSearch) {
      searchResults1.value = response.realEstates || [];
      hasMore1.value = response.totalPages > 1;
      currentPage1.value = 1;
    } else {
      searchResults2.value = response.realEstates || [];
      hasMore2.value = response.totalPages > 1;
      currentPage2.value = 1;
    }
  } catch (err) {
    console.error('Search error:', err);
    if (isFirstSearch) {
      error1.value = '검색 중 오류가 발생했습니다.';
      searchResults1.value = [];
    } else {
      error2.value = '검색 중 오류가 발생했습니다.';
      searchResults2.value = [];
    }
  } finally {
    if (isFirstSearch) {
      loading1.value = false;
    } else {
      loading2.value = false;
    }
  }
};

// 추가 데이터 로드
const loadMore = async (isFirstEstate) => {
  const query = isFirstEstate ? searchQuery1.value : searchQuery2.value;
  
  if (!query || query.length < 2) {
    return;
  }

  try {
    if (isFirstEstate) {
      if (!hasMore1.value || loading1.value) return;
      loading1.value = true;
      error1.value = null;
    } else {
      if (!hasMore2.value || loading2.value) return;
      loading2.value = true;
      error2.value = null;
    }

    const currentPage = isFirstEstate ? currentPage1.value : currentPage2.value;
    
    const response = await realEstateApi.fetchRealEstates({
      searchKey: query,
      searchType: 'apt_nm',
      itemNum: currentPage,
      itemSizePerPage: itemsPerPage
    });

    const newItems = response.realEstates || [];

    if (isFirstEstate) {
      if (newItems.length === 0 || newItems.length < itemsPerPage) {
        hasMore1.value = false;
      }
      if (newItems.length > 0) {
        searchResults1.value = [...searchResults1.value, ...newItems];
        currentPage1.value++;
      }
    } else {
      if (newItems.length === 0 || newItems.length < itemsPerPage) {
        hasMore2.value = false;
      }
      if (newItems.length > 0) {
        searchResults2.value = [...searchResults2.value, ...newItems];
        currentPage2.value++;
      }
    }
  } catch (err) {
    console.error('Load more error:', err);
    if (isFirstEstate) {
      error1.value = '데이터 로드 중 오류가 발생했습니다.';
    } else {
      error2.value = '데이터 로드 중 오류가 발생했습니다.';
    }
  } finally {
    if (isFirstEstate) {
      loading1.value = false;
    } else {
      loading2.value = false;
    }
  }
};

// 부동산 선택 함수
const selectEstate = (estate, isFirstEstate = true) => {
  if (isFirstEstate) {
    isUserSearching1.value = false;
    selectedEstate1.value = estate;
    searchResults1.value = [];
    searchQuery1.value = '';
    hasMore1.value = true;
    currentPage1.value = 0;
  } else {
    isUserSearching2.value = false;
    selectedEstate2.value = estate;
    searchResults2.value = [];
    searchQuery2.value = '';
    hasMore2.value = true;
    currentPage2.value = 0;
  }
};

// 선택 초기화 함수
const clearSelection = (isFirstEstate = true) => {
  if (isFirstEstate) {
    selectedEstate1.value = null;
    searchQuery1.value = '';
    searchResults1.value = [];
    currentPage1.value = 0;
    hasMore1.value = true;
  } else {
    selectedEstate2.value = null;
    searchQuery2.value = '';
    searchResults2.value = [];
    currentPage2.value = 0;
    hasMore2.value = true;
  }
};

// 퍼센트 차이 계산 함수
const calculatePercentage = (higher, lower) => {
  const difference = ((higher - lower) / lower) * 100;
  return Math.round(difference);
};

// Intersection Observer 설정
const setupIntersectionObserver = () => {
  const options = {
    root: null,
    rootMargin: '20px',
    threshold: 0.1,
  };

  const observerCallback1 = (entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore1.value && !loading1.value) {
      loadMore(true);
    }
  };

  const observerCallback2 = (entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore2.value && !loading2.value) {
      loadMore(false);
    }
  };

  if (observer1.value) {
    const intersectionObserver1 = new IntersectionObserver(observerCallback1, options);
    intersectionObserver1.observe(observer1.value);
  }

  if (observer2.value) {
    const intersectionObserver2 = new IntersectionObserver(observerCallback2, options);
    intersectionObserver2.observe(observer2.value);
  }
};

// 옵저버 설정 및 해제
onMounted(() => {
  setupIntersectionObserver();
});

onUnmounted(() => {
  if (observer1.value) {
    const intersectionObserver = new IntersectionObserver(() => {});
    intersectionObserver.unobserve(observer1.value);
    intersectionObserver.disconnect();
  }
  if (observer2.value) {
    const intersectionObserver = new IntersectionObserver(() => {});
    intersectionObserver.unobserve(observer2.value);
    intersectionObserver.disconnect();
  }
});

// 옵저버 요소 감시
watch([observer1, observer2], () => {
  setupIntersectionObserver();
});
</script>

<style scoped>
.compare-title {
  margin-bottom: 30px;
}
.real-estate-compare {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.compare-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.estate-selection {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.estate-selection h3 {
  margin-bottom: 15px;
  color: #333;
}

.search-box input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-top: 0.5rem;
}

.search-item {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-item:hover {
  background-color: #f8f9fa;
}

.search-item:last-child {
  border-bottom: none;
}

.estate-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.9rem;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
}

.info-row:first-child {
  justify-content: space-between;
}

.estate-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.location {
  color: #666;
}

.price {
  color: #2980b9;
  font-weight: 500;
}

.deal-date {
  color: #666;
  font-size: 0.85rem;
}

.floor {
  color: #666;
  font-size: 0.85rem;
}

.area {
  color: #666;
  font-size: 0.85rem;
}

.selected-estate {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  position: relative;
}

.estate-details h4 {
  margin: 0 0 10px 0;
  color: #4c74a6;
}

.estate-details p {
  margin: 5px 0;
  color: #666;
}

.change-button {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 5px 10px;
  background: #4c74a6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.change-button:hover {
  background: #2980b9;
}

.comparison-results {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.comparison-table {
  width: 100%;
  margin-top: 15px;
}

.comparison-row {
  display: grid;
  grid-template-columns: 1fr 2fr 2fr;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.comparison-row:last-child {
  border-bottom: none;
}

.comparison-row:nth-child(odd) {
  background-color: #f8f9fa;
}

.label {
  font-weight: bold;
  color: #333;
}

.value {
  color: #666;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  color: #666;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-more-data {
  text-align: center;
  padding: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.scroll-observer {
  width: 100%;
  height: 10px;
  margin: 5px 0;
}

.difference {
  display: inline-block;
  margin-left: 8px;
  font-size: 0.85rem;
  font-weight: 500;
}

.difference.higher {
  color: #e74c3c;
}

.difference.newer {
  color: #27ae60;
  font-weight: 500;
}
</style>
