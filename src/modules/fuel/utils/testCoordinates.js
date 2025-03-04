/**
 * KATEC 좌표 변환 테스트 스크립트
 * 
 * 이 스크립트는 KATEC 좌표를 WGS84 좌표로 변환하는 함수를 테스트합니다.
 * 테스트 케이스와 실제 변환 결과를 비교하여 정확도를 확인합니다.
 */

import { convertKatecToWGS84, isValidCoordinate } from './coordinateUtils.js';

// 테스트 케이스 목록 (KATEC 좌표와 예상되는 WGS84 좌표)
const testCases = [
  {
    katec: { x: 256485, y: 74179 },
    expected: { lat: 33.253575, lng: 126.45785 },
    description: '제주도 테스트 케이스'
  },
  {
    katec: { x: 198425, y: 452187 },
    expected: { lat: 37.5665, lng: 126.9780 },
    description: '서울 시청 근처'
  },
  {
    katec: { x: 190000, y: 440000 },
    expected: { lat: 37.2, lng: 126.8 },
    description: '경기도 남부 지역'
  },
  {
    katec: { x: 240000, y: 70000 },
    expected: { lat: 33.4, lng: 126.3 },
    description: '제주도 서부 지역'
  }
];

// 테스트 실행 함수
function runTests() {
  console.log('===== KATEC -> WGS84 좌표 변환 테스트 =====');
  console.log('');
  
  let passCount = 0;
  
  testCases.forEach((testCase, index) => {
    const { katec, expected, description } = testCase;
    console.log(`테스트 #${index + 1}: ${description}`);
    console.log(`KATEC 좌표: (${katec.x}, ${katec.y})`);
    console.log(`예상 WGS84: (${expected.lat}, ${expected.lng})`);
    
    // 좌표 변환 실행
    const result = convertKatecToWGS84(katec.x, katec.y);
    
    console.log(`변환 결과: (${result.lat.toFixed(6)}, ${result.lng.toFixed(6)})`);
    
    // 오차 계산 (위도/경도 각각 0.01도 이내면 허용)
    const latDiff = Math.abs(result.lat - expected.lat);
    const lngDiff = Math.abs(result.lng - expected.lng);
    const isAcceptable = latDiff <= 0.01 && lngDiff <= 0.01;
    
    if (isAcceptable) {
      console.log('✅ 테스트 통과');
      passCount++;
    } else {
      console.log(`❌ 테스트 실패 (위도 오차: ${latDiff.toFixed(6)}°, 경도 오차: ${lngDiff.toFixed(6)}°)`);
    }
    
    console.log('');
  });
  
  console.log(`테스트 결과: ${passCount}/${testCases.length} 통과`);
}

// 테스트 실행
runTests();

// 추가 테스트: 유효하지 않은 좌표 처리
console.log('\n===== 유효하지 않은 좌표 테스트 =====');
const invalidCoords = [
  { x: null, y: 74179 },
  { x: 256485, y: null },
  { x: NaN, y: 74179 },
  { x: 256485, y: NaN },
  { x: undefined, y: 74179 },
  { x: 256485, y: undefined }
];

invalidCoords.forEach((coord, index) => {
  console.log(`테스트 #${index + 1}: (${coord.x}, ${coord.y})`);
  console.log(`유효성 검사 결과: ${isValidCoordinate(coord.x, coord.y) ? '유효함' : '유효하지 않음'}`);
  const result = convertKatecToWGS84(coord.x, coord.y);
  console.log(`변환 결과: ${result ? `(${result.lat}, ${result.lng})` : '변환 실패'}`);
  console.log('');
});

console.log('테스트 완료');
