<template>
  <!-- <div v-if="location" class="user-location-info">
    <div class="location-header">
      <i class="location-icon">📍</i>
      <span>현재 위치</span>
    </div>
    <div class="location-coordinates">
      <p>위도: {{ location.latitude.toFixed(6) }}</p>
      <p>경도: {{ location.longitude.toFixed(6) }}</p>
    </div>
  </div> -->
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  location: {
    type: Object,
    default: null
  }
});
</script>

<style scoped>
.user-location-info {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  z-index: 5;
  max-width: 250px;
  font-size: 14px;
}

.location-header {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  font-weight: bold;
}

.location-icon {
  margin-right: 5px;
}

.location-coordinates {
  font-size: 13px;
}

.location-coordinates p {
  margin: 3px 0;
}
</style>
