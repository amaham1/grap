/**
 * 위치 정보 및 거리 계산 유틸리티
 */
import axios from 'axios';

/**
 * 하버사인 공식을 사용하여 두 좌표 사이의 직선 거리를 계산합니다 (km 단위)
 * @param {number} lat1 - 첫 번째 위치의 위도
 * @param {number} lon1 - 첫 번째 위치의 경도
 * @param {number} lat2 - 두 번째 위치의 위도
 * @param {number} lon2 - 두 번째 위치의 경도
 * @returns {number} - 두 지점 사이의 직선 거리 (km)
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
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
 * 거리를 사용자 친화적인 형식으로 포맷팅합니다
 * @param {number} distance - 미터 단위 거리
 * @returns {string} - 포맷팅된 거리 문자열
 */
export const formatDistance = (distance) => {
  if (!distance) return '거리 정보 없음';
  
  if (distance < 1000) {
    // 1km 미만은 미터로 표시
    return `${Math.round(distance)}m`;
  } else {
    // 1km 이상은 소수점 한 자리까지 표시 (km)
    return `${(distance / 1000).toFixed(1)}km`;
  }
};

/**
 * 현재 위치를 가져옵니다
 * @returns {Promise<Object>} - 현재 위치 {latitude, longitude}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation이 지원되지 않는 브라우저입니다.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error('위치 정보를 가져오는데 실패했습니다:', error);
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
};
