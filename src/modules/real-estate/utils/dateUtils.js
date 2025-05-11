/**
 * 날짜 문자열을 지정된 형식으로 포맷팅
 * @param {string|Date} dateString - 날짜 문자열 또는 Date 객체
 * @param {string} format - 출력 형식 (기본값: 'YYYY년 MM월')
 * @returns {string} 포맷팅된 날짜 문자열
 */
export const formatDate = (dateString, format = 'YYYY년 MM월') => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  return format
    .replace('YYYY', year)
    .replace('MM', month.toString().padStart(2, '0'));
};

/**
 * 이전 달의 년도와 월을 반환
 * @param {number} year - 현재 년도
 * @param {number} month - 현재 월
 * @returns {Object} 이전 달의 년도와 월
 */
export const getPreviousMonth = (year, month) => {
  if (month === 1) {
    return {
      year: year - 1,
      month: 12
    };
  }
  return {
    year,
    month: month - 1
  };
};

/**
 * 거래일 포맷팅
 * @param {Object} deal - 거래 정보 객체 (dealYear, dealMonth, dealDay 포함)
 * @returns {string} 포맷팅된 날짜 문자열
 */
export const formatDealDate = (deal) => {
  if (!deal || !deal.dealYear || !deal.dealMonth || !deal.dealDay) {
    return '날짜 정보 없음';
  }
  return `${deal.dealYear}년 ${deal.dealMonth}월 ${deal.dealDay}일`;
};