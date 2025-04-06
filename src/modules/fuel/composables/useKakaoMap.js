import { ref } from 'vue';
import { getCurrentLocation } from '@/utils/geolocationUtils'; // Import from geolocationUtils
// 카카오맵 스크립트 로드 함수
const loadKakaoMapScript = (libraries = []) => { // libraries 파라미터 추가
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    // .env 파일에서 VITE_KAKAO_API_KEY 환경 변수를 사용합니다.
    const apiKey = import.meta.env.VITE_KAKAO_API_KEY;

    if (!apiKey) {
      console.error("Kakao Map API Key is not defined in environment variables (VITE_KAKAO_API_KEY).");
      reject(new Error("Kakao Map API Key is missing."));
      return;
    }
    let scriptSrc = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
    if (libraries.length > 0) {
      scriptSrc += `&libraries=${libraries.join(',')}`; // 라이브러리 파라미터 추가
    }
    script.src = scriptSrc;
    script.onload = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(resolve);
      } else {
        reject(new Error("Kakao Maps SDK failed to load."));
      }
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// 지도 초기화 함수
const initMap = (mapContainerId, initialCenter, initialLevel) => {
  const mapInstance = ref(null);
  const container = document.getElementById(mapContainerId);
  if (!container) {
    console.error("Map container element not found.");
    return { mapInstance: ref(null), error: "Map container element not found." };
  }

  // kakao.maps 객체 및 Map 생성자 확인
  // 지도 컨테이너 요소 확인
  if (!container) {
    console.error(`Map container element with ID '${mapContainerId}' not found.`);
    return { mapInstance: ref(null), error: `Map container element with ID '${mapContainerId}' not found.` };
  }
  // console.log(`Map container element '#${mapContainerId}' found:`, container); // 필요시 주석 해제

  // kakao.maps 객체 및 Map 생성자 확인
  if (!window.kakao || !window.kakao.maps || typeof window.kakao.maps.Map !== 'function') {
    console.error("Kakao Maps SDK or Map constructor is not available or not a function.");
    return { mapInstance: ref(null), error: "Kakao Maps SDK or Map constructor is not available." };
  }
  // console.log("Kakao Maps SDK and Map constructor are available."); // 필요시 주석 해제

  const options = {
    center: new window.kakao.maps.LatLng(initialCenter.lat, initialCenter.lng),
    level: initialLevel,
  };

  // console.log("Attempting to create Kakao Map instance with options:", options); // 필요시 주석 해제
  try {
    const createdMap = new window.kakao.maps.Map(container, options);
    // 생성된 객체가 유효한 지도 객체인지 간단히 확인 (메소드 존재 여부 등)
    if (createdMap && typeof createdMap.getCenter === 'function') {
      mapInstance.value = createdMap;
      // console.log("Kakao Map instance created successfully:", mapInstance.value); // 필요시 주석 해제
      return { mapInstance, error: null };
    } else {
      console.error("new window.kakao.maps.Map did not return a valid map object.");
      return { mapInstance: ref(null), error: "Failed to create a valid Kakao Map instance." };
    }
  } catch (error) {
    console.error("Error occurred during Kakao Map instance creation:", error);
    return { mapInstance: ref(null), error: `Failed to create Kakao Map instance: ${error.message}` };
  }
};

// getCurrentLocationAsync 함수 제거 (geolocationUtils 사용)

// 현재 위치 마커를 저장할 ref
const currentLocationMarker = ref(null);

// 현재 위치를 가져와 지도에 표시하는 함수
const displayCurrentLocation = async (mapInstance) => { // async 추가
  if (!mapInstance || !mapInstance.value) {
    console.error("Map instance is not available for displaying current location.");
    return;
  }

  try {
    const position = await getCurrentLocation(); // geolocationUtils 사용
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const currentPos = new window.kakao.maps.LatLng(lat, lng);

    // 기존 현재 위치 마커 제거
    if (currentLocationMarker.value) {
      currentLocationMarker.value.setMap(null);
    }

    // 현재 위치 마커 생성
    const marker = new window.kakao.maps.Marker({
      position: currentPos,
    });

    marker.setMap(mapInstance.value);
    currentLocationMarker.value = marker; // 새 마커 저장

    // console.log("Current location marker displayed."); // 필요시 주석 해제

  } catch (error) {
    console.error("Error displaying current location:", error.message);
    // TODO: 사용자에게 오류 메시지 표시 (error.message 사용)
  }
};


export function useKakaoMap() {
  return {
    loadKakaoMapScript,
    initMap,
    // getCurrentLocationAsync 제거, getCurrentLocation은 외부 유틸리티 사용
    displayCurrentLocation,
  };
}