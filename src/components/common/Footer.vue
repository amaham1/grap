<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-links">
        <a class="footer-link">안녕하세요. Grap입니다.</a>
        <!-- <a href="#" class="footer-link">이용약관</a>
        <a href="#" class="footer-link">개인정보처리방침</a>
        <a href="#" class="footer-link">고객센터</a> -->
      </div>
      <div class="footer-info">
        <p>주소: 제주도 제주시</p>
        <p>제작자: 최주영</p>
        <p>COPYRIGHT 2025 ALL RIGHTS RESERVED.</p>
      </div>
      <div class="footer-buttons">
        <button class="scroll-top" @click="scrollToTop">
          <font-awesome-icon icon="arrow-up" />
        </button>
        <button class="alert-button" @click="showAlert">
          <font-awesome-icon icon="comment" />
        </button>
      </div>
    </div>
  </footer>
</template>

<script setup>
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

const showAlert = () => {
  alert('문의는 82grap@gmail.com로 연락해주세요.');
};
</script>

<style scoped>
.footer {
  background-color: #333;
  color: #fff;
  padding: 2rem 0;
  width: 100%;
}

.footer-content {
  width: 100%;
  padding: 0 2rem;
  position: relative;
}

.footer-links {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.footer-link {
  color: #fff;
  text-decoration: none;
  font-size: 0.9rem;
}

.footer-link:hover {
  color: #4CAF50;
}

.footer-info {
  max-width: 1200px;
  margin: 0 auto;
  font-size: 0.85rem;
  line-height: 1.6;
  color: #ccc;
}

.footer-buttons {
  position: fixed;
  right: 2rem;
  bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.scroll-top,
.alert-button {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  border: none;
  background-color: #4c74a6;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.scroll-top:hover,
.alert-button:hover {
  background-color: #2980b9;
}

@media (max-width: 768px) {
  .footer-links {
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .footer-buttons {
    right: 1rem;
    bottom: 1rem;
  }
}
</style>
