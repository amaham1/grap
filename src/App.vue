<template>
   <GoogleAdSidebar 
    position="left"
    ad-client="ca-pub-6491895061878011"
    ad-slot="5895025788"
    data-full-width-responsive="true"
  />

  <div id="app">
    <router-view></router-view>
  </div>

  <GoogleAdSidebar 
    position="right"
    ad-client="ca-pub-6491895061878011"
    ad-slot="5895025788"
    data-full-width-responsive="true"
  />
</template>

<script setup>
import GoogleAdSidebar from '@/components/common/GoogleAdSidebar.vue';
</script>

<style>
#app {
  font-family: 'Noto Sans KR', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}
</style>
