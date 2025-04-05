// src/modules/fuel/composables/useMapDisplay.js
import { ref, reactive, watch } from 'vue';

export function useMapDisplay(mapInstance, visibleStations, lowestPriceStations, fuelInfo, fuelPrices, selectedFuelType, fuelTypes, userLocation, isCalculatingDistances) { // fuelInfo 인자 추가
  const markers = ref([]);
  const infowindows = ref([]);
  const openInfowindow = reactive({}); // 현재 열려있는 인포윈도우 추적

  // 포맷팅 함수 임포트 (formatters.js 생성 후 경로 확인 필요)
  // import { formatPrice, formatDistance } from '@/utils/formatters'; // 실제 경로로 수정 필요

  // 가격 포맷팅 함수 (임시로 내장, 추후 formatters.js 임포트)
  const formatPriceLocal = (stationId) => {
    const prices = fuelPrices.value[stationId];
    if (!prices) return '가격 정보 없음';
    const price = prices[selectedFuelType.value];
    const typeInfo = fuelTypes.value.find(f => f.value === selectedFuelType.value);
    const typeText = typeInfo ? typeInfo.text : selectedFuelType.value;
    return price > 0 ? `${typeText}: ${price.toLocaleString()}원` : `${typeText}: 정보 없음`;
  };

  // 거리 포맷팅 함수 (임시로 내장, 추후 formatters.js 임포트)
  const formatDistanceLocal = (station) => {
    if (!userLocation.value) return '위치 정보 없음';
    const isTargetForCalc = lowestPriceStations.value.some(s => s.id === station.id);
    if (isCalculatingDistances.value && isTargetForCalc && station.distance === undefined) return '거리 계산 중...';
    if (typeof station.distance === 'number' && station.distance !== Infinity) {
      const distanceInKm = station.distance / 1000;
      return distanceInKm < 1 ? `도로 ${station.distance}m` : `도로 ${distanceInKm.toFixed(1)}km`;
    } else if (station.distance === Infinity) return '(5km 반경 밖)';
    else if (station.distance === null) return '도로 거리 정보 없음';
    else if (station.distance === undefined) return isTargetForCalc ? '-' : '';
    else return '';
  };


  // 지도에 마커를 표시하는 함수
  const displayMarkers = () => {
    if (!mapInstance.value) return;

    // 기존 마커 및 인포윈도우 제거
    infowindows.value.forEach(infowindow => infowindow.close());
    infowindows.value = [];
    markers.value.forEach(marker => marker.setMap(null));
    markers.value = [];
    Object.keys(openInfowindow).forEach(key => delete openInfowindow[key]); // 열린 인포윈도우 상태 초기화

    if (!Array.isArray(visibleStations.value) || visibleStations.value.length === 0) {
      console.log("No stations to display in the current map view.");
      return;
    }
    console.log(`Displaying ${visibleStations.value.length} markers in the current map view.`);

    const newMarkers = [];
    const newInfowindows = [];
    const lowestPriceStationIds = new Set(lowestPriceStations.value.map(s => s.id));

    const lowestPriceMarkerImageUrl = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png';
    const normalMarkerImageUrl = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png'; // HTTPS URL 사용
    const imageSize = new window.kakao.maps.Size(24, 35);
    const lowestPriceMarkerImage = new window.kakao.maps.MarkerImage(lowestPriceMarkerImageUrl, imageSize);
    const normalMarkerImage = new window.kakao.maps.MarkerImage(normalMarkerImageUrl, imageSize);

    visibleStations.value.forEach((station) => {
      // 가격 정보 확인 (마커 생성 전)
      const stationPrices = fuelPrices.value[station.id];
      if (!stationPrices || !(stationPrices[selectedFuelType.value] > 0)) {
        // console.warn(`Skipping marker for ${station.osnm} (ID: ${station.id}) due to missing/invalid price.`);
        return; // 가격 정보 없으면 마커 생성 안 함
      }

      if (!station || !station.lat || !station.lng) return;

      const markerPosition = new window.kakao.maps.LatLng(station.lat, station.lng);
      const isTop10Lowest = lowestPriceStationIds.has(station.id);
      const markerImage = isTop10Lowest ? lowestPriceMarkerImage : normalMarkerImage;
      const marker = new window.kakao.maps.Marker({ position: markerPosition, title: station.osnm, image: markerImage });

      // 인포윈도우 내용 생성
      const priceContent = formatPriceLocal(station.id); // 임시 로컬 함수 사용
      const distanceContent = formatDistanceLocal(station); // 임시 로컬 함수 사용
      const stationName = station.osnm || '이름 없음';
      const infowindowContent = `<div style="padding:7px;font-size:12px;line-height:1.5;"><strong style="font-size:13px;">${stationName}</strong><br>${priceContent}${distanceContent}</div>`;
      const infowindow = new window.kakao.maps.InfoWindow({ content: infowindowContent, removable: true });

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', () => {
        Object.keys(openInfowindow).forEach(markerId => { if (openInfowindow[markerId]) openInfowindow[markerId].close(); delete openInfowindow[markerId]; });
        infowindow.open(mapInstance.value, marker);
        openInfowindow[station.id] = infowindow;
      });

      // 마커 생성 시 인포윈도우 바로 열기
      infowindow.open(mapInstance.value, marker);
      // openInfowindow[station.id] = infowindow; // 초기 로드 시 상태 관리

      newInfowindows.push(infowindow);
      marker.setMap(mapInstance.value);
      newMarkers.push(marker);
    });
    markers.value = newMarkers;
    infowindows.value = newInfowindows;
  };

  // panToStation 함수 제거 (FuelList.vue로 이동)

  // visibleStations 변경 시 마커 업데이트
  watch(visibleStations, displayMarkers, { deep: true });
  // lowestPriceStations 변경 시 마커 스타일 업데이트를 위해 displayMarkers 호출
  watch(lowestPriceStations, displayMarkers, { deep: true });
  // fuelInfo (거리 정보 포함) 변경 시 마커 업데이트 (인포윈도우 내용 갱신)
  watch(fuelInfo, displayMarkers, { deep: true });


  return {
    markers,
    infowindows,
    openInfowindow,
    displayMarkers
    // panToStation 제거
  };
}