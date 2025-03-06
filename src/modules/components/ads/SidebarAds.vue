<template>
  <div class="sidebar-ads" v-if="showAds">
    <div class="left-sidebar">
      <GoogleAd adSlot="1234567890" adClass="sidebar" />
    </div>
    <div class="right-sidebar">
      <GoogleAd adSlot="0987654321" adClass="sidebar" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import GoogleAd from './GoogleAd.vue';

const route = useRoute();

// index 페이지에서는 광고를 표시하지 않음
const showAds = computed(() => {
  return route.path !== '/';
});
</script>

<style scoped>
.sidebar-ads {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.left-sidebar, .right-sidebar {
  position: absolute;
  top: 90px; /* 헤더 높이 + 여백 */
  width: 160px;
  height: calc(100vh - 120px);
  pointer-events: auto;
}

.left-sidebar {
  left: 10px;
}

.right-sidebar {
  right: 10px;
}

/* 화면이 작을 때는 사이드바 광고 숨김 */
@media (max-width: 1400px) {
  .sidebar-ads {
    display: none;
  }
}
</style>
