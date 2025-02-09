<!-- GoogleAdSidebar.vue -->
<template>
  <div class="ad-sidebar" :class="position">
    <ins class="adsbygoogle"
      :style="adStyle"
      :data-ad-client="adClient"
      :data-ad-slot="adSlot"
      data-ad-format="auto"
      data-full-width-responsive="true">
    </ins>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';

const props = defineProps({
  position: {
    type: String,
    default: 'left',
    validator: v => ['left', 'right'].includes(v)
  },
  adClient: {
    type: String,
    required: true
  },
  adSlot: {
    type: String,
    required: true
  },
  width: {
    type: Number,
    default: 160
  },
  height: {
    type: Number,
    default: 600
  }
});

const adStyle = computed(() => ({
  display: 'inline-block',
  width: `${props.width}px`,
  height: `${props.height}px`
}));

onMounted(() => {
  (window.adsbygoogle = window.adsbygoogle || []).push({});
});
</script>

<style scoped>
.ad-sidebar {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
}

.ad-sidebar.left {
  left: 20px;
}

.ad-sidebar.right {
  right: 20px;
}
</style>