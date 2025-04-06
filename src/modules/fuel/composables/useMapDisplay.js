// src/modules/fuel/composables/useMapDisplay.js
import { ref, reactive, watch } from 'vue';
import { formatPrice, formatStationDistance } from '@/utils/formatters'; // Import formatters

// currentMinPrice 인자 추가
export function useMapDisplay(mapInstance, visibleStations, allFilteredStations, lowestPriceStations, fuelInfo, fuelPrices, selectedFuelType, fuelTypes, userLocation, isCalculatingDistances, isSingleStationView, selectedSingleStation, currentMinPrice) {
  const markers = ref([]);
  const infowindows = ref([]);
  const openInfowindow = reactive({}); // 현재 열려있는 인포윈도우 추적

  // --- Helper Functions ---

  // 인포윈도우 콘텐츠 생성 함수
  const createInfowindowContent = (station, isLowest) => {
    // formatPrice, formatStationDistance 사용 (formatters.js에서 import)
    const priceContent = formatPrice(station.id, fuelPrices.value, selectedFuelType.value, fuelTypes.value);
    const distanceContent = formatStationDistance(station, userLocation.value, isCalculatingDistances.value, lowestPriceStations.value);
    const stationName = station.osnm || '이름 없음';
    const lowestPriceBadge = isLowest ? '<span style="color: #FF0000; font-size: 12px; font-weight: bold; margin-left: 6px; vertical-align: middle; background-color: #FFFFE0; padding: 1px 4px; border-radius: 3px;">★최저가</span>' : '';

    return `
      <div style="padding: 12px 16px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); font-family: 'Malgun Gothic', Dotum, '돋움', sans-serif; background-color: #fff; min-width: 180px; border: none;">
        <strong style="font-size: 15px; font-weight: 600; color: #222; display: inline-block; margin-bottom: 6px; line-height: 1.4; vertical-align: middle;">${stationName}</strong>${lowestPriceBadge}
        <div style="font-size: 13px; color: #444; margin-bottom: 4px; line-height: 1.5;">${priceContent}</div>
        <div style="font-size: 12px; color: #777; line-height: 1.5;">${distanceContent}</div>
      </div>
    `;
  };

  // 마커 및 인포윈도우 생성 및 이벤트 리스너 추가 함수
  const createMarkerAndInfowindow = (station, isLowest) => {
    if (!station || !station.lat || !station.lng) return null;

    const markerPosition = new window.kakao.maps.LatLng(station.lat, station.lng);
    const lowestPriceMarkerImageUrl = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png';
    const normalMarkerImageUrl = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png';
    const imageSize = new window.kakao.maps.Size(24, 35);
    const markerImage = isLowest
      ? new window.kakao.maps.MarkerImage(lowestPriceMarkerImageUrl, imageSize)
      : new window.kakao.maps.MarkerImage(normalMarkerImageUrl, imageSize);

    const marker = new window.kakao.maps.Marker({
      position: markerPosition,
      title: station.osnm,
      image: markerImage
    });

    const infowindowContent = createInfowindowContent(station, isLowest);
    const infowindow = new window.kakao.maps.InfoWindow({
      content: infowindowContent,
      removable: true
    });

    window.kakao.maps.event.addListener(marker, 'click', () => {
      // 다른 인포윈도우 닫기
      Object.keys(openInfowindow).forEach(markerId => {
        if (openInfowindow[markerId]) openInfowindow[markerId].close();
        delete openInfowindow[markerId];
      });
      // 현재 인포윈도우 열기
      infowindow.open(mapInstance.value, marker);
      openInfowindow[station.id] = infowindow; // 열린 상태 추적
    });

    return { marker, infowindow };
  };

  // --- Main Display Logic ---


  // 지도에 마커를 표시하는 함수
  const displayMarkers = () => {
    if (!mapInstance.value) return;

    // 기존 마커 및 인포윈도우 제거 (공통)
    infowindows.value.forEach(infowindow => infowindow.close());
    infowindows.value = [];
    markers.value.forEach(marker => marker.setMap(null));
    markers.value = [];
    Object.keys(openInfowindow).forEach(key => delete openInfowindow[key]);

    const newMarkers = [];
    const newInfowindows = [];

    // --- 단일 주유소 보기 모드 처리 --- (기존과 동일)
    if (isSingleStationView.value && selectedSingleStation.value) {
      const station = selectedSingleStation.value;
      // console.log(`Displaying single marker for: ${station.osnm}`);

      if (!station || !station.lat || !station.lng) {
        console.warn("Invalid station data for single view.");
        return; // 마커/인포윈도우 초기화는 함수 시작 시 수행됨
      }

      // currentMinPrice 사용
      const isLowest = currentMinPrice.value !== Infinity && fuelPrices.value[station.id]?.[selectedFuelType.value] === currentMinPrice.value;
      const created = createMarkerAndInfowindow(station, isLowest);

      if (created) {
        newMarkers.push(created.marker);
        newInfowindows.push(created.infowindow);
        // 단일 보기 시 인포윈도우 바로 열기
        created.infowindow.open(mapInstance.value, created.marker);
        openInfowindow[station.id] = created.infowindow; // 상태 관리
        created.marker.setMap(mapInstance.value);
      }

    // --- 일반 지도 보기 모드 처리 ---
    } else {
      if (!Array.isArray(visibleStations.value) || visibleStations.value.length === 0) { // Check visibleStations
        // console.log("No stations to display in the current map view.");
        markers.value = [];
        infowindows.value = [];
        return;
      }
      // console.log(`Displaying ${visibleStations.value.length} markers in the current map view.`); // Log uses visibleStations

      // 최저가 계산 로직 제거 (currentMinPrice 사용)
      const hasValidLowestPrice = currentMinPrice.value !== Infinity;

      visibleStations.value.forEach((station) => {
        const currentStationPrice = fuelPrices.value[station.id]?.[selectedFuelType.value];
        // 가격 정보가 유효한 주유소만 표시
        if (!(currentStationPrice > 0)) return;

        const isLowest = hasValidLowestPrice && currentStationPrice === currentMinPrice.value;
        const created = createMarkerAndInfowindow(station, isLowest);

        if (created) {
          newMarkers.push(created.marker);
          newInfowindows.push(created.infowindow);
          // 일반 모드에서도 인포윈도우 바로 열기
          created.infowindow.open(mapInstance.value, created.marker);
          openInfowindow[station.id] = created.infowindow; // 상태 관리 추가
          created.marker.setMap(mapInstance.value);
        }
      });
    }

    // 최종 마커 및 인포윈도우 상태 업데이트
    markers.value = newMarkers;
    infowindows.value = newInfowindows;
  };

  // panToStation 함수 제거 (FuelList.vue로 이동)

  // visibleStations 변경 시 마커 업데이트
  // 일반 모드: visibleStations 변경 시 마커 업데이트
  watch(visibleStations, () => { // Watch visibleStations for general mode
    if (!isSingleStationView.value) {
      displayMarkers();
    }
  }, { deep: true });

  // 단일 보기 모드: isSingleStationView 또는 selectedSingleStation 변경 시 마커 업데이트
  watch([isSingleStationView, selectedSingleStation], () => {
    displayMarkers(); // 상태 변경 시 항상 displayMarkers 호출 (내부에서 모드 분기)
  }, { deep: true });


  // 공통: 최저가 목록, 연료 정보, 가격 정보 변경 시 마커 업데이트 (스타일 및 내용 갱신 위해)
  // 단, 단일 보기 모드일 때는 selectedSingleStation이 바뀌지 않는 한 재호출 불필요할 수 있음
  // 하지만 최저가 뱃지 업데이트 등을 위해 호출 유지
  watch(lowestPriceStations, displayMarkers, { deep: true });
  watch(fuelInfo, displayMarkers, { deep: true });
  watch(fuelPrices, displayMarkers, { deep: true });
  watch(selectedFuelType, displayMarkers);
  watch(currentMinPrice, displayMarkers); // 최저가 변경 시 마커 스타일 업데이트


  return {
    markers,
    infowindows,
    openInfowindow,
    displayMarkers
    // panToStation 제거
  };
}