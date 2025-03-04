<!-- src/views/HomeView.vue -->
<template>
  <div class="home">
    <h1>Welcome to Grap</h1>
    <nav>
      <router-link to="/real-estate">부동산 서비스로 이동</router-link>
      <router-link to="/fuel">주유소 서비스로 이동</router-link>
    </nav>
  </div>
</template>

<script setup>
</script>

<style scoped>
.home {
  padding: 20px;
  text-align: center;
}

nav {
  margin-top: 20px;
}

a {
  color: #2c3e50;
  text-decoration: none;
  padding: 10px 20px;
  border: 1px solid #2c3e50;
  border-radius: 4px;
}

a:hover {
  background-color: #2c3e50;
  color: white;
}
</style>