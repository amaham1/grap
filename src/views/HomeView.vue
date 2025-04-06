<!-- src/views/HomeView.vue -->
<template>
  <div class="home">
    <div class="hero">
      <div class="container">
        <h1 class="hero-title">Grap에 오신 것을 환영합니다</h1>
        <p class="hero-subtitle">여러분의 생활을 편리하게 만드는 통합 정보 서비스</p>
        <div class="hero-actions">
          <router-link to="/fuel" class="btn btn-outline">주유소 서비스 시작하기</router-link>
        </div>
      </div>
    </div>
    
    <section class="services">
      <div class="container">
        <h2 class="section-title">제공 서비스</h2>
        <div class="services-grid">
          <div class="service-card">
            <div class="service-icon">🛢️</div>
            <h3>주유소 정보</h3>
            <p>가까운 주유소의 가격 정보를 확인하고 저렴하게 주유해보세요.</p>
            <router-link to="/fuel" class="service-link">자세히 보기 →</router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
</script>

<style scoped>
/* 기존 스타일 유지하면서 새로운 스타일 추가 */
.home {
  padding: 0;
  text-align: center;
}

nav {
  margin-top: 20px;
}

/* 히어로 섹션 */
.hero {
  background: linear-gradient(135deg, #3498db, #2c3e50);
  color: white;
  padding: 5rem 0;
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('data:image/svg+xml;charset=utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"%3E%3Cpath fill="%23ffffff" fill-opacity="0.05" d="M0,128L48,122.7C96,117,192,107,288,128C384,149,480,203,576,208C672,213,768,171,864,144C960,117,1056,107,1152,117.3C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"%3E%3C/path%3E%3C/svg%3E');
  background-position: bottom;
  background-repeat: no-repeat;
  background-size: cover;
  z-index: 1;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  position: relative;
  z-index: 2;
}

.hero-subtitle {
  font-size: 1.25rem;
  font-weight: 300;
  margin-bottom: 2rem;
  opacity: 0.9;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
  z-index: 2;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 0.25rem;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  text-decoration: none;
}

.btn-primary {
  background-color: #f39c12;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #e67e22;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn-outline {
  background-color: transparent;
  color: white;
  border: 2px solid white;
}

.btn-outline:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 서비스 섹션 */
.services {
  padding: 5rem 0;
  background-color: var(--bg-light);
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 3rem;
  position: relative;
  display: inline-block;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 3px;
  background-color: var(--primary-color);
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.service-card {
  background-color: white;
  border-radius: 0.5rem;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  text-align: center;
}

.service-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.service-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.service-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.service-card p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.service-link {
  color: var(--primary-color);
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
}

.service-link:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}

@media (max-width: 768px) {
  .hero {
    padding: 3rem 0;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .hero-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .services-grid {
    grid-template-columns: 1fr;
  }
}
</style>