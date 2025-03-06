<!-- src/modules/real-estate/views/RealEstateLayout.vue -->
<template>
  <modern-layout>
    <template #logo>
      <h2><router-link to="/">GRAP</router-link></h2>
    </template>
    
    <template #navigation>
      <ul class="nav-links">
        <li><router-link to="/real-estate">부동산 검색</router-link></li>
      </ul>
    </template>
    
    <template #mobile-navigation>
      <ul class="mobile-nav-links">
        <li><router-link to="/real-estate">부동산 검색</router-link></li>
      </ul>
    </template>
    
    <router-view></router-view>
    
    <template #footer>
      <div class="footer-content">
        <div class="footer-section">
          <h2><router-link to="/">GRAP</router-link></h2>
          <p>전국 부동산 매물 정보 서비스</p>
        </div>
        <div class="footer-section">
          <h3>관련 링크</h3>
          <ul>
            <li><a href="https://www.r-one.co.kr/" target="_blank">한국부동산원</a></li>
            <li><a href="https://www.molit.go.kr/" target="_blank">국토교통부</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h3>문의</h3>
          <p>realestate@grap.com</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2025 GRAP. All rights reserved.</p>
      </div>
    </template>
  </modern-layout>
</template>

<script setup>
import ModernLayout from '@/modules/components/ui/ModernLayout.vue';
</script>

<style scoped>
.nav-links, .mobile-nav-links {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-links li {
  margin-right: 1.5rem;
}

.mobile-nav-links {
  flex-direction: column;
  padding: 1rem 0;
}

.mobile-nav-links li {
  margin: 0.5rem 0;
}

.nav-links a, .mobile-nav-links a {
  color: #333;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-links a:hover, .mobile-nav-links a:hover,
.nav-links a.router-link-active, .mobile-nav-links a.router-link-active {
  color: #3498db;
}

.footer-content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.footer-section {
  flex: 1;
  min-width: 200px;
  margin-bottom: 1rem;
}

.footer-section h3 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section li {
  margin-bottom: 0.5rem;
}

.footer-section a {
  color: #666;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-section a:hover {
  color: #3498db;
}

.footer-bottom {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  color: #888;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
  }
  
  .footer-section {
    margin-bottom: 1.5rem;
  }
}
</style>