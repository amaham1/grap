import axios from 'axios';

const KAKAO_MOBILITY_REST_API_KEY = import.meta.env.VITE_KAKAO_MOBILITY_REST_API_KEY;
const DIRECTIONS_API_URL = 'https://apis-navi.kakaomobility.com/v1/directions';

/**
 * 카카오모빌리티 길찾기 API를 호출하여 두 지점 간의 실제 도로 거리를 계산합니다.
 * @param {object} origin - 출발지 좌표 { longitude: number, latitude: number }
 * @param {object} destination - 도착지 좌표 { longitude: number, latitude: number }
 * @returns {Promise<number|null>} 실제 도로 거리 (미터 단위) 또는 오류 발생 시 null
 */
export async function getDirections(origin, destination) {
  if (!KAKAO_MOBILITY_REST_API_KEY) {
    console.error('Kakao Mobility REST API Key is not configured.');
    return null;
  }

  if (!origin || !destination || !origin.longitude || !origin.latitude || !destination.longitude || !destination.latitude) {
    console.error('Invalid origin or destination coordinates.');
    return null;
  }

  try {
    const response = await axios.get(DIRECTIONS_API_URL, {
      params: {
        origin: `${origin.longitude},${origin.latitude}`,
        destination: `${destination.longitude},${destination.latitude}`,
        waypoints: '', // 경유지 없음
        priority: 'RECOMMEND', // 추천 경로
        car_fuel: 'GASOLINE', // 연료 종류 (필요시 변경)
        car_hipass: false, // 하이패스 유무
        alternatives: false, // 대안 경로 미포함
        road_details: false, // 상세 도로 정보 미포함
      },
      headers: {
        Authorization: `KakaoAK ${KAKAO_MOBILITY_REST_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    // API 응답 구조 확인 및 거리 정보 추출
    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      if (route.summary && typeof route.summary.distance === 'number') {
        return route.summary.distance; // 미터 단위 거리 반환
      }
    }
    console.error('Could not extract distance from Kakao Mobility API response:', response.data);
    return null;
  } catch (error) {
    console.error('Error calling Kakao Mobility Directions API:', error.response ? error.response.data : error.message);
    return null;
  }
}