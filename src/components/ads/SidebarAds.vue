<template>
  <div class="bottom-ads" v-if="showAds">
    <div class="bottom-ads-container">
      <!-- TODO: 하단 광고에 적합한 광고 슬롯 ID로 변경 필요 -->
      <GoogleAd adSlot="1234567890" adClass="bottom-banner" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
// 중복된 import 제거
import GoogleAd from '@/components/ads/GoogleAd.vue'; // GoogleAd 컴포넌트 경로 수정 (프로젝트 구조에 맞게 확인 필요)

const route = useRoute();

// index 페이지에서는 광고를 표시하지 않음
const showAds = computed(() => {
  return route.path !== '/';
});
</script>

<style scoped>
.bottom-ads {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60px; /* 모바일 광고 높이 (조정 가능) */
  background-color: #f8f9fa; /* 배경색 추가 (선택 사항) */
  border-top: 1px solid #dee2e6; /* 상단 경계선 (선택 사항) */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* 다른 요소 위에 오도록 z-index 조정 */
  pointer-events: auto; /* 광고 클릭 가능하도록 설정 */
}

.bottom-ads-container {
  /* 광고 컨텐츠 레이아웃 조정 (필요시) */
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* GoogleAd 컴포넌트 자체 스타일 조정이 필요할 수 있음 */
:deep(.bottom-banner) { /* GoogleAd 내부 클래스에 스타일 적용 (클래스명 확인 필요) */
  /* 예시: width: 100%; height: 100%; */
}
</style>
