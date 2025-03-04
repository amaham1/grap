/**
 * 오피넷 API 서비스
 * 지역별 최저가 주유소(TOP20) 목록을 가져오는 서비스
 */

import axios from 'axios';

// 상수 정의
const API_BASE_URL = '/api/opinet/lowTop10.do'; // 프록시 URL로 변경
const API_CODE = 'F250302145';

// 유류 종류 목록
export const FUEL_TYPES = [
  { value: 'B027', label: '휘발유' },
  { value: 'D047', label: '경유' },
  { value: 'B034', label: '고급휘발유' },
  { value: 'C004', label: '실내등유' },
  { value: 'K015', label: '자동차부탄' }
];

// 지역 코드 목록 (한글 이름 기준 가나다 순 정렬)
export const AREA_CODES = [
  { value: '03', label: '강원' },
  { value: '16', label: '광주' },
  { value: '14', label: '대구' },
  { value: '17', label: '대전' },
  { value: '10', label: '부산' },
  { value: '01', label: '서울' },
  { value: '19', label: '세종' },
  { value: '18', label: '울산' },
  { value: '15', label: '인천' },
  { value: '11', label: '제주' },
  { value: '06', label: '전북' },
  { value: '07', label: '전남' },
  { value: '02', label: '경기' },
  { value: '09', label: '경남' },
  { value: '08', label: '경북' },
  { value: '04', label: '충북' },
  { value: '05', label: '충남' }
];

/**
 * 지역별 최저가 주유소 목록을 가져오는 함수
 * @param {string} prodcd - 제품 코드 (기본값: 'B027' 휘발유)
 * @param {string} area - 지역 코드 (기본값: '11' 제주)
 * @param {number} cnt - 결과 개수 (기본값: 20)
 * @returns {Promise} - API 응답 Promise 객체
 */
export const fetchLowestPriceFuelStations = async (prodcd = 'B027', area = '11', cnt = 20) => {
  try {
    const response = await axios.get(API_BASE_URL, {
      params: {
        code: API_CODE,
        out: 'json',
        prodcd,
        area,
        cnt
      }
    });
    
    // API 응답에서 주유소 목록 추출
    if (response.data && response.data.RESULT && response.data.RESULT.OIL) {
      return response.data.RESULT.OIL;
    }
    
    return [];
  } catch (error) {
    console.error('주유소 정보를 가져오는 중 오류가 발생했습니다:', error);
    throw error;
  }
};
