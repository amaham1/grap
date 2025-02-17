<template>
  <header class="header">
    <div class="header-container">
      <!-- 로고 섹션 -->
      <div class="logo-section">
        <router-link to="/" class="logo-link">
          <span class="logo-text">Grap</span>
        </router-link>
      </div>

      <!-- 네비게이션 메뉴 -->
      <nav class="nav-menu">
        <div 
          class="nav-item-wrapper"
          @mouseenter="showDropdown = true"
          @mouseleave="showDropdown = false"
        >
          <router-link to="/" class="nav-item">부동산 매매 정보</router-link>
          <div v-if="showDropdown" class="dropdown-menu">
            <router-link to="/" class="dropdown-item">부동산 매매 정보</router-link>
            <router-link to="/compare" class="dropdown-item">부동산 매매 비교</router-link>
          </div>
        </div>
      </nav>

      <!-- 우측 버튼 영역 -->
      <div class="right-section">
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue';

const showDropdown = ref(false);
</script>

<style scoped>
.header {
  width: 100%;
  height: 64px;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

.header-container {
  max-width: 1280px;
  height: 100%;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-section {
  flex-shrink: 0;
}

.logo-link {
  text-decoration: none;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #4c74a6;
  letter-spacing: -0.5px;
}

.nav-menu {
  display: flex;
  gap: 2rem;
  margin: 0 2rem;
}

.nav-item-wrapper {
  position: relative;
  padding: 1rem 0;
}

.nav-item {
  color: #374151;
  text-decoration: none;
  font-size: 0.95rem;
  padding: 0.5rem;
}

.nav-item:hover {
  color: #2980b9;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  padding: 0.5rem 0;
}

.dropdown-item {
  display: block;
  padding: 0.5rem 1rem;
  color: #374151;
  text-decoration: none;
  font-size: 0.95rem;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f3f4f6;
  color: #2980b9;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.signin-link {
  background-color: #f97316;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.95rem;
}

.dark-mode-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: transparent;
  cursor: pointer;
}
</style>