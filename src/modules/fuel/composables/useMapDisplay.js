// src/modules/fuel/composables/useMapDisplay.js
import { ref, reactive, watch } from 'vue';

export function useMapDisplay(mapInstance, stationsInBounds, allFilteredStations, lowestPriceStations, fuelInfo, fuelPrices, selectedFuelType, fuelTypes, userLocation, isCalculatingDistances, isSingleStationView, selectedSingleStation) { // isSingleStationView, selectedSingleStation 추가
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

    // 기존 마커 및 인포윈도우 제거 (공통)
    infowindows.value.forEach(infowindow => infowindow.close());
    infowindows.value = [];
    markers.value.forEach(marker => marker.setMap(null));
    markers.value = [];
    Object.keys(openInfowindow).forEach(key => delete openInfowindow[key]);

    const newMarkers = [];
    const newInfowindows = [];

    // --- 단일 주유소 보기 모드 처리 ---
    if (isSingleStationView.value && selectedSingleStation.value) {
      const station = selectedSingleStation.value;
      console.log(`Displaying single marker for: ${station.osnm}`);

      if (!station || !station.lat || !station.lng) {
        console.warn("Invalid station data for single view.");
        markers.value = []; // 마커 초기화
        infowindows.value = []; // 인포윈도우 초기화
        return;
      }

      const markerPosition = new window.kakao.maps.LatLng(station.lat, station.lng);
      // 단일 보기 시에는 항상 일반 마커 사용 (최저가 표시는 인포윈도우에서)
      const normalMarkerImageUrl = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png';
      const imageSize = new window.kakao.maps.Size(24, 35);
      const normalMarkerImage = new window.kakao.maps.MarkerImage(normalMarkerImageUrl, imageSize);
      const marker = new window.kakao.maps.Marker({ position: markerPosition, title: station.osnm, image: normalMarkerImage });

      // 최저가 계산 (단일 보기에서도 뱃지 표시 위해)
      let actualLowestPrice = Infinity;
      if (allFilteredStations && Array.isArray(allFilteredStations.value)) {
        allFilteredStations.value.forEach(s => {
          const prices = fuelPrices.value[s.id];
          if (prices && prices[selectedFuelType.value] > 0) {
            actualLowestPrice = Math.min(actualLowestPrice, prices[selectedFuelType.value]);
          }
        });
      }
      const hasValidLowestPrice = actualLowestPrice !== Infinity;
      const currentStationPrice = fuelPrices.value[station.id]?.[selectedFuelType.value];
      const isActualLowestPrice = hasValidLowestPrice && currentStationPrice === actualLowestPrice;

      // 인포윈도우 내용 생성
      const priceContent = formatPriceLocal(station.id);
      const distanceContent = formatDistanceLocal(station);
      const stationName = station.osnm || '이름 없음';
      const lowestPriceBadge = isActualLowestPrice ? '<span style="color: #FF0000; font-size: 12px; font-weight: bold; margin-left: 6px; vertical-align: middle; background-color: #FFFFE0; padding: 1px 4px; border-radius: 3px;">★최저가</span>' : '';
      const infowindowContent = `
        <div style="padding: 12px 16px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); font-family: 'Malgun Gothic', Dotum, '돋움', sans-serif; background-color: #fff; min-width: 180px;">
          <strong style="font-size: 15px; font-weight: 600; color: #222; display: inline-block; margin-bottom: 6px; line-height: 1.4; vertical-align: middle;">${stationName}</strong>${lowestPriceBadge}
          <div style="font-size: 13px; color: #444; margin-bottom: 4px; line-height: 1.5;">${priceContent}</div>
          <div style="font-size: 12px; color: #777; line-height: 1.5;">${distanceContent}</div>
        </div>
      `;
      const infowindow = new window.kakao.maps.InfoWindow({ content: infowindowContent, removable: true });

      // 마커 클릭 이벤트 (단일 보기에서도 필요)
      window.kakao.maps.event.addListener(marker, 'click', () => {
        Object.keys(openInfowindow).forEach(markerId => { if (openInfowindow[markerId]) openInfowindow[markerId].close(); delete openInfowindow[markerId]; });
        infowindow.open(mapInstance.value, marker);
        openInfowindow[station.id] = infowindow;
      });

      // 마커 생성 시 인포윈도우 바로 열기
      infowindow.open(mapInstance.value, marker);
      openInfowindow[station.id] = infowindow; // 상태 관리

      newInfowindows.push(infowindow);
      marker.setMap(mapInstance.value);
      newMarkers.push(marker);

    // --- 일반 지도 보기 모드 처리 ---
    } else {
      if (!Array.isArray(stationsInBounds.value) || stationsInBounds.value.length === 0) {
        console.log("No stations to display in the current map view.");
        markers.value = []; // 마커 초기화
        infowindows.value = []; // 인포윈도우 초기화
        return;
      }
      console.log(`Displaying ${stationsInBounds.value.length} markers in the current map view.`);

      // 실제 최저 가격 계산 (전체 필터링된 주유소 기준)
      let actualLowestPrice = Infinity;
      if (allFilteredStations && Array.isArray(allFilteredStations.value)) {
        allFilteredStations.value.forEach(station => {
          const prices = fuelPrices.value[station.id];
          if (prices && prices[selectedFuelType.value] > 0) {
            actualLowestPrice = Math.min(actualLowestPrice, prices[selectedFuelType.value]);
          }
        });
      } else {
        console.warn("allFilteredStations is not available for lowest price calculation.");
        stationsInBounds.value.forEach(station => {
          const prices = fuelPrices.value[station.id];
          if (prices && prices[selectedFuelType.value] > 0) {
            actualLowestPrice = Math.min(actualLowestPrice, prices[selectedFuelType.value]);
          }
        });
      }
      const hasValidLowestPrice = actualLowestPrice !== Infinity;

      const lowestPriceMarkerImageUrl = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png';
      const normalMarkerImageUrl = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png';
      const imageSize = new window.kakao.maps.Size(24, 35);
      const lowestPriceMarkerImage = new window.kakao.maps.MarkerImage(lowestPriceMarkerImageUrl, imageSize);
      const normalMarkerImage = new window.kakao.maps.MarkerImage(normalMarkerImageUrl, imageSize);

      stationsInBounds.value.forEach((station) => {
        const stationPrices = fuelPrices.value[station.id];
        if (!stationPrices || !(stationPrices[selectedFuelType.value] > 0)) return;
        if (!station || !station.lat || !station.lng) return;

        const markerPosition = new window.kakao.maps.LatLng(station.lat, station.lng);
        const currentStationPrice = fuelPrices.value[station.id]?.[selectedFuelType.value];
        const isActualLowestPrice = hasValidLowestPrice && currentStationPrice === actualLowestPrice;
        const markerImage = isActualLowestPrice ? lowestPriceMarkerImage : normalMarkerImage;
        const marker = new window.kakao.maps.Marker({ position: markerPosition, title: station.osnm, image: markerImage });

        const priceContent = formatPriceLocal(station.id);
        const distanceContent = formatDistanceLocal(station);
        const stationName = station.osnm || '이름 없음';
        const lowestPriceBadge = isActualLowestPrice ? '<span style="color: #FF0000; font-size: 12px; font-weight: bold; margin-left: 6px; vertical-align: middle; background-color: #FFFFE0; padding: 1px 4px; border-radius: 3px;">★최저가</span>' : '';
        const infowindowContent = `
          <div style="padding: 12px 16px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); font-family: 'Malgun Gothic', Dotum, '돋움', sans-serif; background-color: #fff; min-width: 180px;">
            <strong style="font-size: 15px; font-weight: 600; color: #222; display: inline-block; margin-bottom: 6px; line-height: 1.4; vertical-align: middle;">${stationName}</strong>${lowestPriceBadge}
            <div style="font-size: 13px; color: #444; margin-bottom: 4px; line-height: 1.5;">${priceContent}</div>
            <div style="font-size: 12px; color: #777; line-height: 1.5;">${distanceContent}</div>
          </div>
        `;
        const infowindow = new window.kakao.maps.InfoWindow({ content: infowindowContent, removable: true });

        window.kakao.maps.event.addListener(marker, 'click', () => {
          Object.keys(openInfowindow).forEach(markerId => { if (openInfowindow[markerId]) openInfowindow[markerId].close(); delete openInfowindow[markerId]; });
          infowindow.open(mapInstance.value, marker);
          openInfowindow[station.id] = infowindow;
        });

        // 일반 모드에서는 인포윈도우 바로 열지 않음 (클릭 시 열림)
        // infowindow.open(mapInstance.value, marker);

        newInfowindows.push(infowindow);
        marker.setMap(mapInstance.value);
        newMarkers.push(marker);
      });
    }

    // 최종 마커 및 인포윈도우 상태 업데이트
    markers.value = newMarkers;
    infowindows.value = newInfowindows;
  };

  // panToStation 함수 제거 (FuelList.vue로 이동)

  // visibleStations 변경 시 마커 업데이트
  // 일반 모드: stationsInBounds 변경 시 마커 업데이트
  watch(stationsInBounds, () => {
    if (!isSingleStationView.value) { // 단일 보기 모드가 아닐 때만 실행
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
  watch(selectedFuelType, displayMarkers); // 유종 변경 시에도 갱신


  return {
    markers,
    infowindows,
    openInfowindow,
    displayMarkers
    // panToStation 제거
  };
}