<template>
  <div class="app">
    <div class="content-container">
      <div class="content-wrapper">
        <div class="sidebar-left" :class="{ 'hide-sidebar': isSmallScreen }">
          <GoogleAdSidebar 
            position="left"
            ad-client="ca-pub-6491895061878011"
            ad-slot="5895025788"
            data-full-width-responsive="true"
          />
        </div>
        <Header />
        <div id="app">
          <router-view></router-view>
          <div v-if="isSmallScreen" class="mobile-ads">
            <GoogleAdSidebar 
              position="bottom"
              ad-client="ca-pub-6491895061878011"
              ad-slot="5895025788"
              data-full-width-responsive="true"
            />
          </div>
        </div>

        <div class="sidebar-right" :class="{ 'hide-sidebar': isSmallScreen }">
          <GoogleAdSidebar 
            position="right"
            ad-client="ca-pub-6491895061878011"
            ad-slot="5895025788"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import GoogleAdSidebar from '@/components/common/GoogleAdSidebar.vue'
import Header from '@/components/common/Header.vue'
import Footer from '@/components/common/Footer.vue'

const isSmallScreen = ref(false)

const checkScreenSize = () => {
  isSmallScreen.value = window.innerWidth <= 1600
}

onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>

<style>
/* Reset default margins and padding */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

#app {
  padding-top: 64px; /* Header의 높이만큼 상단 패딩 추가 */
}
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.content-container {
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: center;
}

.content-wrapper {
  max-width: 1500px;
  width: 100%;
  display: flex;
  position: relative;
  gap: 20px;
}

.sidebar-left,
.sidebar-right {
  width: 160px;
  position: sticky;
  top: 20px;
  height: fit-content;
}

#app {
  font-family: 'Noto Sans KR', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  flex: 1;
}

.mobile-ads {
  margin-top: 20px;
  width: 100%;
}

@media (max-width: 1600px) {
  .hide-sidebar {
    display: none;
  }

  .content-wrapper {
    padding: 20px;
    flex-direction: column;
  }

  #app {
    width: 100%;
  }
}
</style>
