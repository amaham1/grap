import { ref } from 'vue';
import proj4 from 'proj4';
import axios from 'axios';

const API_BASE_URL = '/api/opinet/aroundAll.do'; // 프록시 URL로 변경

/**
 * KATEC 좌표를 WGS84 경위도 좌표로 변환하는 함수
 * 한국 전역에서 사용 가능한 범용 알고리즘
 * 
 * @param {number} x - X 좌표 (KATEC)
 * @param {number} y - Y 좌표 (KATEC)
 * @returns {object} - 변환된 WGS84 좌표 {lat: 위도, lng: 경도}
 */
export const convertKatecToWGS84 = (x, y) => {
  try {
    if (!isValidCoordinate(x, y)) {
      throw new Error('유효하지 않은 좌표입니다.');
    }

    // KATEC 좌표계 정의
    proj4.defs('KATEC', '+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43');

    // WGS84 좌표계는 기본적으로 정의되어 있음 (EPSG:4326)
    proj4.defs('WGS84', '+proj=longlat +datum=WGS84 +no_defs');

    // KATEC에서 WGS84로 변환하는 함수
    function katecToWgs84(x, y) {
        // proj4 변환: [x, y] 형식으로 입력
        const [lon, lat] = proj4('KATEC', 'WGS84', [x, y]);
        return { longitude: lon, latitude: lat };
    }

    // 예제 사용
    const katecX = x; // 예제 KATEC X 좌표
    const katecY = y; // 예제 KATEC Y 좌표

    const result = katecToWgs84(katecX, katecY);

    return {
      lat: result.latitude,
      lng: result.longitude
    };
  } catch (error) {
    console.error('좌표 변환 중 오류 발생:', error);
    // 오류 발생 시 (0, 0) 반환 대신 한국 중심 좌표 반환
    return {
      lat: 36.0,
      lng: 128.0
    };
  }
};

/**
 * 좌표가 유효한지 검사
 * @param {number} x - X좌표 (KATEC)
 * @param {number} y - Y좌표 (KATEC)
 * @returns {boolean} - 유효한 좌표인지 여부
 */
export const isValidCoordinate = (x, y) => {
  return x && y && !isNaN(x) && !isNaN(y);
};

export function useGasStationFinder() {
  const apiKey = ref('F250302145'); // Opinet에서 발급받은 API 키로 대체
  const gasStations = ref([]); // 주유소 목록
  const isLoading = ref(false); // 로딩 상태
  const error = ref(null); // 에러 메시지

  // WGS84에서 KATEC으로 변환
  const convertToKATEC = (longitude, latitude) => {
      if (typeof longitude !== 'number' || typeof latitude !== 'number') {
          throw new Error('경도와 위도는 숫자여야 합니다.');
      }
      
      const point = proj4('EPSG:4326', 'KATEC', [longitude, latitude]);
      
      return { x: point[0], y: point[1] };
  };

  // KATEC 좌표계 정의
  proj4.defs('KATEC', '+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43');

  // 반경 내 주유소 정보 가져오기
  const fetchGasStations = async (longitude, latitude, radius = 5000, prodcd = 'B027', sort = 1) => {
      isLoading.value = true;
      error.value = null;

      try {
          const katecCoords = convertToKATEC(longitude, latitude);
          
          const response = await axios.get(API_BASE_URL, {
              params: {
                  code: apiKey.value,
                  x: katecCoords.x,
                  y: katecCoords.y,
                  radius, // 검색 반경 (최대 5000m)
                  prodcd, // 연료 타입 (B027: 휘발유)
                  sort,   // 정렬 방식 (1: 거리순)
                  out: 'json' // 응답 형식
              }
          });

          if (response.data.RESULT && response.data.RESULT.OIL) {
              // 주유소 데이터를 먼저 가격순으로 정렬하고, 가격이 같으면 거리순으로 정렬
              gasStations.value = response.data.RESULT.OIL
                .sort((a, b) => {
                  // 가격 비교 (오름차순)
                  const priceA = parseFloat(a.PRICE) || Number.MAX_VALUE;
                  const priceB = parseFloat(b.PRICE) || Number.MAX_VALUE;
                  
                  if (priceA !== priceB) {
                    return priceA - priceB; // 가격 오름차순
                  }
                  
                  // 가격이 같으면 거리로 정렬 (오름차순)
                  return parseFloat(a.DISTANCE) - parseFloat(b.DISTANCE);
                });
          } else {
              throw new Error('주유소 데이터를 찾을 수 없습니다.');
          }
      } catch (err) {
        
          error.value = err.message || 'API 요청 중 오류가 발생했습니다.';
      } finally {
          isLoading.value = false;
      }
  };

  return { gasStations, isLoading, error, fetchGasStations };
}