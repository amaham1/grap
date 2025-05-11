<template>
  <div class="map-section">
    <h2>위치 정보</h2>
    <div id="map" class="map-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useKakaoMap } from '@/modules/fuel/composables/useKakaoMap'; // useKakaoMap import (경로 확인 필요)

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

const mapInstance = ref(null); // map -> mapInstance 이름 변경 (composable과 일치)
const marker = ref(null);
const { loadKakaoMapScript, initMap } = useKakaoMap(); // composable 사용
const initializeMap = async () => {
  try {
    // 스크립트 로드
    if (!window.kakao || !window.kakao.maps) {
      await loadKakaoMapScript(); // libraries 필요 없음
    }

    // 지도 초기화 (useKakaoMap 사용)
    const initialCenter = { lat: props.latitude, lng: props.longitude };
    const { mapInstance: initializedMap, error: mapError } = initMap('map', initialCenter, 3); // level 3

    if (mapError) {
      throw new Error(mapError);
    }
    if (!initializedMap || !initializedMap.value) {
      throw new Error("Failed to get map instance.");
    }
    mapInstance.value = initializedMap.value; // mapInstance ref에 할당

    // 마커 생성 (지도 인스턴스 사용)
    marker.value = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(props.latitude, props.longitude),
      map: mapInstance.value // mapInstance 사용
    });

    // 지도 크기 재조정 (mapInstance 사용)
    window.kakao.maps.event.addListener(mapInstance.value, 'idle', function() {
      mapInstance.value.relayout();
    });

  } catch (error) {
    console.error('카카오맵 초기화 중 오류 발생:', error.message); // error.message 사용
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
  if (mapInstance.value) { // mapInstance 사용
    mapInstance.value = null;
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
  height: 600px;
  margin-top: 10px;
  border-radius: 4px;
  position: relative;
  z-index: 1;
}
</style>
