/**
 * 거리를 미터 또는 킬로미터 단위로 포맷팅
 * @param {number} meters - 미터 단위의 거리
 * @returns {string} 포맷팅된 거리 문자열
 */
export const formatDistance = (meters) => {
  return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
};

/**
 * 숫자를 천 단위 구분자가 있는 문자열로 포맷팅
 * @param {number} amount - 포맷팅할 숫자
 * @returns {string} 포맷팅된 숫자 문자열
 */
export const formatAmount = (amount) => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};