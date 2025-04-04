/**
 * 두 지점 간의 거리를 Haversine 공식을 사용하여 미터(m) 단위로 계산합니다.
 * @param {number} lat1 지점 1의 위도
 * @param {number} lon1 지점 1의 경도
 * @param {number} lat2 지점 2의 위도
 * @param {number} lon2 지점 2의 경도
 * @returns {number} 두 지점 간의 거리 (미터 단위)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // 미터 단위 거리
  return distance;
}