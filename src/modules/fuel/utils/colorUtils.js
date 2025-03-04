/**
 * 주유소 가격 구간별 색상 유틸리티 함수
 */

/**
 * 가격 구간별 파스텔톤 색상 정의
 * 낮음: 파스텔 초록색, 중간: 파스텔 노랑색, 높음: 파스텔 빨간색
 */
const PRICE_COLORS = {
  LOW: '#a8e6cf',  // 파스텔 초록색 (낮은 가격)
  MEDIUM: '#fdffab', // 파스텔 노랑색 (중간 가격)
  HIGH: '#ffcfdf'   // 파스텔 빨간색 (높은 가격)
};

/**
 * 안전하게 가격 문자열을 숫자로 변환
 * @param {string|number} price - 변환할 가격
 * @returns {number} 변환된 숫자 가격
 */
const safeParsePrice = (price) => {
  if (typeof price === 'number') return price;
  
  // 문자열에서 숫자가 아닌 문자 제거 (쉼표, 공백 등)
  const cleanPrice = String(price).replace(/[^0-9.]/g, '');
  return parseFloat(cleanPrice) || 0;
};


/**
 * 주유소 가격 구간 결정 (낮음/중간/높음)
 * @param {number|string} price - 주유소 가격
 * @param {Array} stations - 모든 주유소 배열
 * @param {boolean} returnColor - true면 색상 코드 반환, false면 구간 이름 반환
 * @returns {string} 색상 코드 또는 구간 이름
 */
const determinePriceCategory = (price, stations, returnColor) => {
  if (!stations || !stations.length) {
    return returnColor ? PRICE_COLORS.MEDIUM : '중간';
  }
  
  // 현재 가격을 안전하게 숫자로 변환
  const numericPrice = safeParsePrice(price);
  
  // 모든 주유소의 가격 추출 및 정렬 (안전하게 숫자로 변환)
  const priceObjects = stations
    .map(station => ({
      id: station.UNI_ID,
      price: safeParsePrice(station.PRICE)
    }))
    .filter(item => item.price > 0) // 유효한 가격만 필터링
    .sort((a, b) => a.price - b.price); // 가격 오름차순 정렬
  
  // 가격 데이터가 없으면 중간 반환
  if (!priceObjects.length) {
    return returnColor ? PRICE_COLORS.MEDIUM : '중간';
  }
  
  // 주유소 개수를 3등분하여 구간 계산
  const totalCount = priceObjects.length;
  const lowerThresholdIndex = Math.floor(totalCount / 3);
  const upperThresholdIndex = Math.floor(totalCount * 2 / 3);
  
  // 임계값 가격 설정
  const lowerThresholdPrice = priceObjects[lowerThresholdIndex]?.price;
  const upperThresholdPrice = priceObjects[upperThresholdIndex]?.price;
  
  // 가격에 따른 구간 결정
  let category;
  
  if (numericPrice < lowerThresholdPrice) {
    category = returnColor ? PRICE_COLORS.LOW : '낮음';
  } else if (numericPrice > upperThresholdPrice) {
    category = returnColor ? PRICE_COLORS.HIGH : '높음';
  } else {
    category = returnColor ? PRICE_COLORS.MEDIUM : '중간';
  }
  
  return category;
};

/**
 * 가격 범위에 따른 색상 구간 계산
 * @param {number|string} price - 주유소 가격
 * @param {Array} stations - 모든 주유소 배열
 * @returns {string} 색상 코드 (HEX)
 */
export const getPriceColor = (price, stations) => {
  return determinePriceCategory(price, stations, true);
};

/**
 * 가격 구간 이름 반환
 * @param {number|string} price - 주유소 가격
 * @param {Array} stations - 모든 주유소 배열
 * @returns {string} 가격 구간 이름 (낮음, 중간, 높음)
 */
export const getPriceLevel = (price, stations) => {
  return determinePriceCategory(price, stations, false);
};

/**
 * 최저가 주유소인지 확인하는 함수
 * @param {number|string} price - 확인할 주유소의 가격
 * @param {Array} stations - 비교할 전체 주유소 목록
 * @returns {boolean} - 최저가 여부
 */
export const isLowestPrice = (price, stations) => {
  if (!stations || stations.length === 0) return false;
  
  // 현재 주유소 가격
  const currentPrice = safeParsePrice(price);
  
  // 모든 주유소 중 최저가 찾기
  const lowestPrice = stations.reduce((min, station) => {
    const stationPrice = safeParsePrice(station.PRICE);
    return stationPrice > 0 && stationPrice < min ? stationPrice : min;
  }, Number.MAX_VALUE);
  
  // 현재 주유소가 최저가인지 확인 (동일 가격이 여러 개일 수 있으므로 === 사용)
  return currentPrice === lowestPrice && currentPrice > 0;
};
