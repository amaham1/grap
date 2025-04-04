import { ref } from 'vue';

// 카카오맵 스크립트 로드 함수
const loadKakaoMapScript = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    // .env 파일에서 VITE_KAKAO_API_KEY 환경 변수를 사용합니다.
    const apiKey = import.meta.env.VITE_KAKAO_API_KEY;

    if (!apiKey) {
      console.error("Kakao Map API Key is not defined in environment variables (VITE_KAKAO_API_KEY).");
      reject(new Error("Kakao Map API Key is missing."));
      return;
    }
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
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

// 현재 위치를 비동기적으로 가져오는 함수
const getCurrentLocationAsync = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      resolve(null); // 실패 시 null 반환
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        // console.log(`Async current location obtained: Lat ${lat}, Lng ${lng}`); // 필요시 주석 해제
        resolve({ lat, lng }); // 성공 시 좌표 객체 반환
      },
      (error) => {
        console.error("Error getting current location asynchronously:", error);
        resolve(null); // 실패 시 null 반환
      },
      {
        enableHighAccuracy: true,
        // timeout: 10000,
        // maximumAge: 0
      }
    );
  });
};

// 현재 위치 마커를 저장할 ref
const currentLocationMarker = ref(null);

// 현재 위치를 가져와 지도에 표시하는 함수
const displayCurrentLocation = (mapInstance) => {
  if (!mapInstance || !mapInstance.value) {
    console.error("Map instance is not available for displaying current location.");
    return;
  }
  if (!navigator.geolocation) {
    console.error("Geolocation is not supported by this browser.");
    // 사용자에게 알림 표시 가능
    return;
  }

  // console.log("Attempting to get current location..."); // 필요시 주석 해제
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const currentPos = new window.kakao.maps.LatLng(lat, lng);

      // console.log(`Current location obtained: Lat ${lat}, Lng ${lng}`); // 필요시 주석 해제

      // 기존 현재 위치 마커 제거
      if (currentLocationMarker.value) {
        currentLocationMarker.value.setMap(null);
      }

      // 현재 위치 마커 생성 (커스텀 이미지 사용 가능)
      const marker = new window.kakao.maps.Marker({
        position: currentPos,
        // image: markerImage // 필요시 커스텀 마커 이미지 설정
      });

      marker.setMap(mapInstance.value);
      currentLocationMarker.value = marker; // 새 마커 저장

      // 지도를 현재 위치로 이동 (선택 사항)
      // mapInstance.value.setCenter(currentPos);
      // console.log("Current location marker displayed."); // 필요시 주석 해제

    },
    (error) => {
      console.error("Error getting current location:", error);
      // 사용자에게 오류 알림 표시 가능 (예: 위치 권한 거부)
      let errorMessage = "현재 위치를 가져올 수 없습니다.";
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "위치 정보 접근 권한이 거부되었습니다.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "현재 위치 정보를 사용할 수 없습니다.";
          break;
        case error.TIMEOUT:
          errorMessage = "위치 정보를 가져오는 시간이 초과되었습니다.";
          break;
        case error.UNKNOWN_ERROR:
          errorMessage = "알 수 없는 오류가 발생했습니다.";
          break;
      }
      // TODO: 사용자에게 errorMessage 표시
      console.error(errorMessage);
    },
    {
      enableHighAccuracy: true, // 높은 정확도 요청 (배터리 소모 증가 가능)
      // timeout: 10000, // 타임아웃 설정 (ms)
      // maximumAge: 0 // 캐시된 위치 사용 안 함
    }
  );
};


export function useKakaoMap() {
  return {
    loadKakaoMapScript,
    initMap,
    getCurrentLocationAsync, // 현재 위치 비동기 조회 함수 추가
    displayCurrentLocation,
  };
}