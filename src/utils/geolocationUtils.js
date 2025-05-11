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

/**
 * 브라우저 Geolocation API를 사용하여 현재 위치를 비동기적으로 가져옵니다.
 * @returns {Promise<GeolocationPosition>} 성공 시 GeolocationPosition 객체를 resolve하는 Promise
 * @throws {Error} Geolocation API를 지원하지 않거나 위치 정보를 가져오는 데 실패한 경우 Error 객체를 reject하는 Promise
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(position);
      },
      (error) => {
        let errorMessage = 'Unknown error occurred while retrieving location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'User denied the request for Geolocation.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out.';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true, // 높은 정확도 요청
        timeout: 10000, // 10초 타임아웃
        maximumAge: 0 // 캐시된 위치 사용 안 함
      }
    );
  });
}