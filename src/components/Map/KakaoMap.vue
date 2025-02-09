<template>
  <div class="map-section">
    <h2>위치 정보</h2>
    <div id="map" class="map-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { initKakaoMap } from '@/api/kakaoMapApi';

const props = defineProps({
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  }
});

const map = ref(null);
const marker = ref(null);

const initializeMap = async () => {
  try {
    // 카카오맵 SDK 초기화
    await initKakaoMap();
    
    // 지도 컨테이너 확인
    const container = document.getElementById('map');
    if (!container) {
      console.warn('지도를 표시할 DOM 요소를 찾을 수 없습니다.');
      return;
    }

    // 지도 옵션 설정
    const options = {
      center: new window.kakao.maps.LatLng(props.latitude, props.longitude),
      level: 3
    };

    // 새 지도 인스턴스 생성
    map.value = new window.kakao.maps.Map(container, options);

    // 마커 생성
    marker.value = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(props.latitude, props.longitude),
      map: map.value
    });

    // 지도 크기 재조정
    window.kakao.maps.event.addListener(map.value, 'idle', function() {
      map.value.relayout();
    });

  } catch (error) {
    console.error('카카오맵 초기화 중 오류 발생:', error);
  }
};

// 컴포넌트가 마운트될 때 지도 초기화
onMounted(() => {
  initializeMap();
});

// 컴포넌트가 언마운트될 때 지도 인스턴스 정리
onUnmounted(() => {
  if (marker.value) {
    marker.value.setMap(null);
    marker.value = null;
  }
  if (map.value) {
    map.value = null;
  }
});
</script>

<style scoped>
.map-section {
  margin: 20px 0;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.map-container {
  width: 100%;
  height: 400px;
  margin-top: 10px;
  border-radius: 4px;
  position: relative;
  z-index: 1;
}
</style>
