<template>
  <div class="google-ad" :class="adClass">
    <div :id="adId" class="ad-container">
      <!-- 구글 광고가 여기에 로드됩니다 -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps } from 'vue';

const props = defineProps({
  adSlot: {
    type: String,
    required: true
  },
  adFormat: {
    type: String,
    default: 'auto'
  },
  adLayout: {
    type: String,
    default: 'in-article'
  },
  adClass: {
    type: String,
    default: ''
  }
});

const adId = ref(`google-ad-${Math.random().toString(36).substring(2, 15)}`);

onMounted(() => {
  // 구글 광고 스크립트가 로드되었는지 확인
  if (window.adsbygoogle) {
    loadAd();
  } else {
    // 구글 광고 스크립트 로드
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6491895061878011';
    script.crossOrigin = 'anonymous';
    script.onload = loadAd;
    document.head.appendChild(script);
  }
});

const loadAd = () => {
  try {
    // 광고 요소 생성
    const adElement = document.createElement('ins');
    adElement.className = 'adsbygoogle';
    adElement.style.display = 'block';
    adElement.dataset.adClient = 'ca-pub-6491895061878011'; // 실제 광고 클라이언트 ID로 변경 필요
    adElement.dataset.adSlot = props.adSlot;
    adElement.dataset.adFormat = props.adFormat;
    
    if (props.adLayout) {
      adElement.dataset.adLayout = props.adLayout;
    }
    
    // 기존 광고 컨테이너 비우기
    const container = document.getElementById(adId.value);
    if (container) {
      container.innerHTML = '';
      container.appendChild(adElement);
      
      // 광고 로드
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    }
  } catch (error) {
    console.error('광고 로드 중 오류 발생:', error);
  }
};
</script>

<style scoped>
.google-ad {
  width: 100%;
  min-height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px 0;
  overflow: hidden;
}

.ad-container {
  width: 100%;
  min-height: 100px;
}

/* 사이드바 광고 스타일 */
.google-ad.sidebar {
  position: sticky;
  top: 90px; /* 헤더 높이 + 여백 */
  height: calc(100vh - 120px);
  max-width: 300px;
}

/* 모바일 환경에서 사이드바 광고 스타일 조정 */
@media (max-width: 768px) {
  .google-ad.sidebar {
    position: static;
    height: auto;
    max-width: 100%;
    margin: 20px 0;
  }
}
</style>
