<template>
  <div class="app">
    <nav class="main-nav" v-if="showHeader">
      <div class="container">
        <router-link to="/" class="logo">GRAP</router-link>
        <div class="nav-links">
          <!-- <router-link to="/real-estate" class="nav-link">부동산</router-link> -->
          <router-link to="/fuel" class="nav-link">주유소</router-link>
        </div>
      </div>
    </nav>
    <main>
      <router-view></router-view>
    </main>
    <!-- <footer class="main-footer" v-if="showFooter">
      <div class="container">
        <p>&copy; 2025 GRAP. All rights reserved.</p>
      </div>
    </footer> -->
    
    <!-- 사이드바 광고 컴포넌트 -->
    <!-- <SidebarAds /> -->
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SidebarAds from '@/components/ads/SidebarAds.vue' // 경로 수정

const route = useRoute()

// 특정 페이지에서는 헤더와 푸터를 숨길 수 있도록 설정
const showHeader = computed(() => {
  // 필요에 따라 특정 경로에서 헤더를 숨길 수 있음
  return true
})

const showFooter = computed(() => {
  // 필요에 따라 특정 경로에서 푸터를 숨길 수 있음
  return true
})
</script>

<style>
/* 전역 리셋 및 기본 스타일 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* 메인 컬러 */
  --primary-color: #3498db;
  --primary-dark: #2980b9;
  --secondary-color: #2ecc71;
  --accent-color: #f39c12;
  
  /* 텍스트 색상 */
  --text-primary: #333;
  --text-secondary: #666;
  --text-light: #999;
  
  /* 배경 색상 */
  --bg-light: #f9f9f9;
  --bg-white: #ffffff;
  
  /* 테두리 색상 */
  --border-color: #ddd;
  
  /* 그림자 */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.15);
  
  /* 폰트 사이즈 */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  
  /* 간격 */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  
  /* 테두리 반경 */
  --rounded-sm: 0.125rem;
  --rounded: 0.25rem;
  --rounded-md: 0.375rem;
  --rounded-lg: 0.5rem;
  
  /* 컨테이너 크기 */
  --container-width: 1200px;
}

body {
  font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: var(--text-primary);
  line-height: 1.6;
  background-color: var(--bg-light);
}

a {
  text-decoration: none;
  color: var(--primary-color);
  transition: color 0.2s ease-in-out;
}

a:hover {
  color: var(--primary-dark);
}

.container {
  width: 100%;
  max-width: var(--container-width);
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
  position: relative; /* 자식 요소의 절대 위치 기준 */
}

/* 헤더 스타일 */
.main-nav {
  background-color: var(--bg-white);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-4) 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.main-nav .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--primary-color);
}

.nav-links {
  display: flex;
  gap: var(--spacing-6);
}

.nav-link {
  color: var(--text-primary);
  font-weight: 500;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--rounded);
  transition: all 0.2s ease-in-out;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--primary-color);
  background-color: rgba(52, 152, 219, 0.1);
}

/* 푸터 스타일 */
.main-footer {
  background-color: var(--bg-white);
  padding: var(--spacing-8) 0;
  margin-top: var(--spacing-8);
  border-top: 1px solid var(--border-color);
}

/* 버튼 스타일 */
.btn {
  display: inline-block;
  background-color: var(--primary-color);
  color: white;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--rounded);
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, transform 0.1s ease-in-out;
}

.btn:hover {
  background-color: var(--primary-dark);
}

.btn:active {
  transform: translateY(1px);
}

.btn-secondary {
  background-color: var(--secondary-color);
}

.btn-secondary:hover {
  background-color: #27ae60;
}

.btn-accent {
  background-color: var(--accent-color);
}

.btn-accent:hover {
  background-color: #e67e22;
}

.btn-outline {
  background-color: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
}

.btn-outline:hover {
  background-color: var(--primary-color);
  color: white;
}

/* 카드 스타일 */
.card {
  background-color: var(--bg-white);
  border-radius: var(--rounded-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-6);
  transition: box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* 그리드 시스템 */
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--spacing-4);
}

/* 반응형 */
@media (max-width: 768px) {
  .container {
    padding: 0 var(--spacing-4);
  }
  
  .main-nav {
    padding: var(--spacing-3) 0;
  }
  
  .nav-links {
    gap: var(--spacing-3);
  }
  
  .nav-link {
    padding: var(--spacing-1) var(--spacing-2);
  }
}

/* 카카오맵 인포윈도우 기본 테두리 제거 */
.wrap.infowindow, /* 카카오맵에서 사용하는 일반적인 클래스 조합 */
.infowindow_wrap, /* 또 다른 가능한 클래스 */
.infowindow { /* 가장 일반적인 클래스 */
  border: none !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important; /* 기존 그림자는 유지하거나 필요시 제거 */
  background-color: transparent !important; /* 배경색 투명하게 하여 내부 div 스타일만 보이도록 */
}

/* 인포윈도우 내용 영역의 불필요한 테두리 방지 (useMapDisplay.js에서 이미 처리했지만 확실히) */
.wrap .info {
  border: none !important;
}

/* 인포윈도우 닫기 버튼 스타일 조정 (선택 사항) */
.infowindow_close {
  /* 필요한 경우 스타일 조정 */
}
</style>
