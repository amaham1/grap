/**
 * 두 지점 간의 거리를 계산하는 유틸리티 함수
 */

/**
 * 하버사인 공식을 사용하여 두 좌표 사이의 거리를 계산합니다 (km 단위)
 * @param {number} lat1 - 첫 번째 위치의 위도
 * @param {number} lon1 - 첫 번째 위치의 경도
 * @param {number} lat2 - 두 번째 위치의 위도
 * @param {number} lon2 - 두 번째 위치의 경도
 * @returns {number} - 두 지점 사이의 거리 (km)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // 지구 반경 (km)
  const R = 6371;
  
  // 라디안으로 변환
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  // 하버사인 공식
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // 킬로미터 단위
  
  return distance;
};

/**
 * 도(degree)를 라디안(radian)으로 변환
 * @param {number} deg - 도 단위 각도
 * @returns {number} - 라디안 단위 각도
 */
const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

/**
 * 거리를 사용자 친화적인 형식으로 포맷팅
 * @param {number} distance - 킬로미터 단위 거리
 * @returns {string} - 포맷팅된 거리 문자열
 */
export const formatDistance = (distance) => {
  if (distance < 1) {
    // 1km 미만은 미터로 표시
    return `${Math.round(distance * 1000)}m`;
  } else {
    // 1km 이상은 소수점 한 자리까지 표시
    return `${distance.toFixed(1)}km`;
  }
};
