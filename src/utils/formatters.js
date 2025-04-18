// src/utils/formatters.js

/**
 * 주유소 가격 정보를 포맷팅합니다.
 * @param {string | number} stationId - 주유소 ID
 * @param {object} fuelPrices - 전체 주유소 가격 정보 객체
 * @param {string} selectedFuelType - 선택된 유종 (예: 'gasoline')
 * @param {Array<object>} fuelTypes - 유종 정보 배열 (text, value 포함)
 * @returns {string} 포맷팅된 가격 문자열
 */
export function formatPrice(stationId, fuelPrices, selectedFuelType, fuelTypes) {
  const prices = fuelPrices[stationId];
  if (!prices) return '가격 정보 없음';
  const price = prices[selectedFuelType];
  const typeInfo = fuelTypes.find(f => f.value === selectedFuelType);
  const typeText = typeInfo ? typeInfo.text : selectedFuelType; // 유종 이름 가져오기
  return price > 0 ? `${typeText}: ${price.toLocaleString()}원` : `${typeText}: 정보 없음`;
}

/**
 * 주유소 거리 정보를 포맷팅합니다.
 * @param {object} station - 주유소 정보 객체 (distance 속성 포함)
 * @param {object | null} userLocation - 사용자 위치 정보 객체 또는 null
 * @param {boolean} isCalculatingDistances - 거리 계산 진행 여부
 * @param {Array<object>} lowestPriceStations - 최저가 주유소 목록 (거리 계산 대상 확인용)
 * @returns {string} 포맷팅된 거리 문자열
 */
export function formatStationDistance(station, userLocation, isCalculatingDistances, lowestPriceStations) {
  if (!userLocation) return '위치 정보 없음';

  const isTargetForCalc = lowestPriceStations.some(s => s.id === station.id);

  if (isCalculatingDistances && isTargetForCalc && station.distance === undefined) return '거리 계산 중...';
  if (typeof station.distance === 'number' && station.distance !== Infinity) {
    const distanceInKm = station.distance / 1000;
    // 1km 미만일 경우 m 단위로 반올림하여 표시
    return distanceInKm < 1 ? `자동차 거리 ${Math.round(station.distance)}m` : `자동차 거리 ${distanceInKm.toFixed(1)}km`;
  } else if (station.distance === Infinity) return '(5km 반경 밖)';
  else if (station.distance === null) return '도로 거리 정보 없음';
  else if (station.distance === undefined) return isTargetForCalc ? '거리 계산 중...' : ''; // 계산 대상이면 '거리 계산 중...' 표시
  else return '';
}

/**
 * 거리를 미터 또는 킬로미터 단위로 포맷팅 (단순 변환)
 * @param {number} meters - 미터 단위의 거리
 * @returns {string} 포맷팅된 거리 문자열
 */
export const formatDistance = (meters) => {
  if (typeof meters !== 'number' || meters < 0) return ''; // 유효성 검사 추가
  return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
};

/**
 * 숫자를 천 단위 구분자가 있는 문자열로 포맷팅
 * @param {number} amount - 포맷팅할 숫자
 * @returns {string} 포맷팅된 숫자 문자열
 */
export const formatAmount = (amount) => {
  if (typeof amount !== 'number') return ''; // 유효성 검사 추가
  return amount.toLocaleString(); // toLocaleString() 사용이 더 간결하고 안전함
};