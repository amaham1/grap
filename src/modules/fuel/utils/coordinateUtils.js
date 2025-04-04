import { ref } from 'vue';
import proj4 from 'proj4';
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_OPINET_BASE_URL || '/api/opinet';

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

/**
 * 두 지점 사이의 선을 지정된 개수로 나누어 각 지점의 좌표를 반환하는 함수
 * @param {Object} start - 시작점 좌표 {lat: number, lng: number}
 * @param {Object} end - 끝점 좌표 {lat: number, lng: number}
 * @param {number} segments - 분할할 구간 수
 * @returns {Array<Object>} - 분할된 지점들의 좌표 배열 [{lat: number, lng: number}, ...]
 */
export const divideLineIntoPoints = (start, end, segments = 10) => {
  const points = [];
  
  for (let i = 0; i <= segments; i++) {
    const ratio = i / segments;
    const lat = start.lat + (end.lat - start.lat) * ratio;
    const lng = start.lng + (end.lng - start.lng) * ratio;
    points.push({ lat, lng });
  }
  
  return points;
};

export function useGasStationFinder() {
  const apiKey = ref('F250302145');
  const gasStations = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

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
  const fetchGasStations = async (longitude, latitude, radius = 1000, prodcd = 'gasoline', sort = 1) => {
    if (radius > 5000) {
      throw new Error('검색 반경은 최대 5km(5000m)를 초과할 수 없습니다.');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const katecCoords = convertToKATEC(longitude, latitude);
      
      // 캐시된 데이터 확인
      const cachedData = localStorage.getItem('gasStationsData');
      const cachedTimestamp = localStorage.getItem('gasStationsTimestamp');
      const TWO_DAYS_IN_MS = 2 * 24 * 60 * 60 * 1000;
      
      let apiData;
      
      // 캐시 유효성 검사
      if (cachedData && cachedTimestamp) {
        const now = new Date().getTime();
        const timestamp = parseInt(cachedTimestamp);
        
        // 캐시가 2일 이내인 경우 캐시된 데이터 사용
        if (now - timestamp < TWO_DAYS_IN_MS) {
          console.log('캐시된 데이터 사용');
          apiData = JSON.parse(cachedData);
        }
      }
      
      // 캐시된 데이터가 없거나 만료된 경우 API 호출
      if (!apiData) {
        console.log('API 호출로 새로운 데이터 가져오기');
        const response = await axios.get(`/api/its/api/infoGasInfoList?code=860665`);
        
        if (response.data && response.data.result === 'success' && response.data.info) {
          // 데이터 캐싱
          localStorage.setItem('gasStationsData', JSON.stringify(response.data));
          localStorage.setItem('gasStationsTimestamp', new Date().getTime().toString());
          apiData = response.data;
        }
      }
      
      if (apiData && apiData.info && apiData.info.length > 0) {
        // 주유소 데이터 필터링 (1000m 이내)
        const filteredStations = apiData.info.filter(station => {
          // 두 좌표 사이의 거리 계산 (KATEC 좌표계 사용)
          const stationX = parseFloat(station.gisxcoor);
          const stationY = parseFloat(station.gisycoor);
          
          if (isNaN(stationX) || isNaN(stationY)) return false;
          
          // 유클리드 거리 계산 (단순 직선 거리)
          const distance = Math.sqrt(
            Math.pow(stationX - katecCoords.x, 2) + 
            Math.pow(stationY - katecCoords.y, 2)
          );
          
          // 거리 정보 추가 (미터 단위)
          station.distance = distance;
          
          // 지정된 반경 내에 있는지 확인
          return distance <= radius;
        });

        // 연료 가격 정보 가져오기
        const fuelPrices = await fetchFuelPrices(filteredStations.map(station => station.id));
        // 주유소 ID별 연료 가격 매핑
        const fuelPriceMap = {};
        if (fuelPrices && fuelPrices.info && Array.isArray(fuelPrices.info)) {
          fuelPrices.info.forEach(item => {
            if (!item || !item.id) return;
        
            const id = item.id;
            // 연료 가격 정보 구조화
            fuelPriceMap[id] = {  
              gasoline: parseFloat(item.gasoline) || 0,          // 휘발유
              premium_gasoline: parseFloat(item.premium_gasoline) || 0, // 고급유
              diesel: parseFloat(item.diesel) || 0,          // 경유
              lpg: parseFloat(item.lpg) || 0            // LPG
            };
          });
        }
    
        // 주유소 데이터에 연료 가격 정보 추가
        const stationsWithPrices = filteredStations.map(station => {
          const stationId = station.id;
          if (stationId && fuelPriceMap[stationId]) {
            return {
              ...station,
              fuelPrices: fuelPriceMap[stationId]
            };
          }
          // 가격 정보가 없는 경우 빈 객체 추가
          return {
            ...station,
            fuelPrices: {
              gasoline: 0,
              premium_gasoline: 0,
              diesel: 0,
              lpg: 0
            }
          };
        });
        
        // 거리 기준으로 정렬
        gasStations.value = stationsWithPrices
          .sort((a, b) => a.distance - b.distance)
          .map(station => ({
            id: station.id,
            poll: station.poll,
            gpoll: station.gpoll,
            osnm: station.osnm,
            zip: station.zip,
            adr: station.adr,
            tel: station.tel,
            lpgyn: station.lpgyn,
            gisxcoor: station.gisxcoor,
            gisycoor: station.gisycoor,
            distance: Math.round(station.distance), // 미터 단위로 반올림
            fuelPrices: station.fuelPrices
          }));
      } else {
        throw new Error('주유소 데이터를 찾을 수 없습니다.');
      }
    } catch (err) {
      error.value = err.message || 'API 요청 중 오류가 발생했습니다.';
      gasStations.value = [];
    } finally {
      isLoading.value = false;
    }

    return {
      stations: gasStations.value,
      error: error.value
    };
  };

  

  return {
    gasStations,
    isLoading,
    error,
    fetchGasStations
  };
}

// 연료 가격 정보 가져오기
export const fetchFuelPrices = async () => {
  // 로컬스토리지 캐시 키 생성
  const cacheKey = 'fuelPrices_cache';
  
  try {
    // 캐시된 데이터 확인
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      const parsedCache = JSON.parse(cachedData);
      const currentTime = new Date().getTime();
      
      // 캐시 만료 시간 확인 (1시간 = 3600000 밀리초)
      if (parsedCache.timestamp && (currentTime - parsedCache.timestamp < 3600000)) {
        console.log('캐시된 연료 가격 데이터 사용');
        console.log(parsedCache.data)
        return parsedCache.data;
      }
    }
    
    // 캐시가 없거나 만료된 경우 API 호출
    const apiUrl = `/api/its/api/infoGasPriceList?code=860665`;
    const response = await axios.get(apiUrl);

    // 응답 데이터 확인
    if (!response.data || !response.data.info) {
      console.warn('연료 가격 데이터가 없거나 형식이 올바르지 않습니다.');
      return { info: [] }; 
    }
    
    // 데이터를 캐시에 저장 (타임스탬프 포함)
    const cacheData = {
      timestamp: new Date().getTime(),
      data: response.data
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log('새로운 연료 가격 데이터 캐싱');
    
    
    return response.data;
  } catch (error) {
    console.error('연료 가격 정보를 가져오는 중 오류 발생:', error);
    return { info: [] };
  }
};