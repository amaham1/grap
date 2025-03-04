/**
 * 주유소 브랜드별 색상 및 유틸리티 함수
 */

// 브랜드별 색상 정의
export const brandColors = {
  'SKE': '#ed1c24', // SK에너지
  'GSC': '#ff7e00', // GS칼텍스
  'HDO': '#0066b3', // 현대오일뱅크
  'SOL': '#00447c', // S-OIL
  'RTE': '#7cb342', // 자영알뜰
  'RTX': '#8bc34a', // 고속도로알뜰
  'NHO': '#4caf50', // 농협알뜰
  'ETC': '#9e9e9e', // 자가상표
  'E1G': '#f44336', // E1
  'SKG': '#e91e63', // SK가스
  'RTO': '#4caf50'  // 알뜰주유소
};

// 브랜드 이름 반환 함수
export const getBrandName = (brandCode) => {
  const brands = {
    'SKE': 'SK에너지',
    'GSC': 'GS칼텍스',
    'HDO': '현대오일뱅크',
    'SOL': 'S-OIL',
    'RTE': '자영알뜰',
    'RTX': '고속도로알뜰',
    'NHO': '농협알뜰',
    'ETC': '자가상표',
    'E1G': 'E1',
    'SKG': 'SK가스',
    'RTO': '알뜰주유소'
  };
  
  return brands[brandCode] || brandCode;
};

// 브랜드 색상 반환 함수
export const getBrandColor = (brandCode) => {
  return brandColors[brandCode] || '#9e9e9e'; // 기본 색상은 회색
};

// 브랜드별 스타일 클래스 반환 함수
export const getBrandClass = (brandCode) => {
  return `brand-${brandCode.toLowerCase()}`;
};
