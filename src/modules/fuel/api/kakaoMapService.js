/**
 * 카카오 로컬 API 서비스
 * 주소 검색과 좌표 변환을 위한 서비스
 */
import axios from 'axios';

// Kakao REST API 키 (환경 변수로 관리하는 것을 권장)
// 실제 사용 시 본인의 API 키로 교체 필요
const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_API_KEY || 'YOUR_KAKAO_API_KEY';

// 헤더 설정
const kakaoHeaders = {
  'Authorization': `KakaoAK ${KAKAO_API_KEY}`
};

/**
 * 주소를 좌표로 변환하는 함수 (Kakao Local API)
 * @param {string} address - 검색할 주소
 * @returns {Promise} - API 응답 Promise 객체
 */
export const getCoordinatesByAddress = async (address) => {
  try {
    if (!address) {
      throw new Error('주소가 제공되지 않았습니다.');
    }

    // 프록시 URL을 사용하여 CORS 문제 해결
    const response = await axios.get('/api/kakao/v2/local/search/address.json', {
      headers: kakaoHeaders,
      params: {
        query: address,
        analyze_type: 'similar' // 유사한 주소 패턴까지 검색
      }
    });

    // 검색 결과가 있는 경우 첫 번째 결과의 좌표 반환
    if (response.data && response.data.documents && response.data.documents.length > 0) {
      const document = response.data.documents[0];
      return {
        lat: parseFloat(document.y),  // 위도
        lng: parseFloat(document.x)   // 경도
      };
    }

    // 검색 결과가 없는 경우 null 반환
    return null;
  } catch (error) {
    console.error('주소 검색 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 키워드로 장소를 검색하는 함수 (Kakao Local API)
 * @param {string} keyword - 검색할 키워드
 * @param {object} options - 검색 옵션 (x, y, radius 등)
 * @returns {Promise} - API 응답 Promise 객체
 */
export const searchPlacesByKeyword = async (keyword, options = {}) => {
  try {
    if (!keyword) {
      throw new Error('검색어가 제공되지 않았습니다.');
    }

    const response = await axios.get('/api/kakao/v2/local/search/keyword.json', {
      headers: kakaoHeaders,
      params: {
        query: keyword,
        x: options.x,
        y: options.y,
        radius: options.radius || 5000,
        page: options.page || 1,
        size: options.size || 15
      }
    });

    return response.data;
  } catch (error) {
    console.error('장소 검색 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 좌표계를 변환하는 함수 (Kakao Local API)
 * @param {number} x - X 좌표
 * @param {number} y - Y 좌표
 * @param {string} inputCoord - 입력 좌표계 (KATEC)
 * @param {string} outputCoord - 출력 좌표계 (기본값: WGS84)
 * @returns {Promise} - API 응답 Promise 객체
 */
export const convertCoordinate = async (x, y, inputCoord = 'KATEC', outputCoord = 'WGS84') => {
  try {
    if (!x || !y) {
      throw new Error('좌표가 제공되지 않았습니다.');
    }

    const response = await axios.get('/api/kakao/v2/local/geo/transcoord.json', {
      headers: kakaoHeaders,
      params: {
        x,
        y,
        input_coord: inputCoord
      }
    });

    // 변환 결과가 있는 경우 첫 번째 결과의 좌표 반환
    if (response.data && response.data.documents && response.data.documents.length > 0) {
      const document = response.data.documents[0];
      return {
        lat: parseFloat(document.y),  // 위도
        lng: parseFloat(document.x)   // 경도
      };
    }

    // 변환 결과가 없는 경우 null 반환
    return null;
  } catch (error) {
    console.error('좌표 변환 중 오류 발생:', error);
    throw error;
  }
};
