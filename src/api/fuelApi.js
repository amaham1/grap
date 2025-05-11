import { convertKatecToWgs84 } from '@/utils/coordinateConverter';

// JSON 데이터를 파싱하고 좌표 변환하여 구조화된 배열로 반환
const parseAndTransformFuelData = (jsonString) => {
  if (!jsonString) {
    return [];
  }

  try {
    const jsonData = JSON.parse(jsonString);

    if (jsonData.result !== 'success' || !Array.isArray(jsonData.info)) {
      console.error("Invalid JSON data structure received from API:", jsonData);
      return [];
    }

    const gasInfoItems = jsonData.info;
    const structuredData = [];

    for (let i = 0; i < gasInfoItems.length; i++) {
      const item = gasInfoItems[i];
      const katecXStr = item.gisxcoor;
      const katecYStr = item.gisycoor;
      const katecX = parseFloat(katecXStr);
      const katecY = parseFloat(katecYStr);

      if (isNaN(katecX) || isNaN(katecY)) {
        continue;
      }

      const wgs84Coords = convertKatecToWgs84(katecX, katecY);

      if (wgs84Coords) {
        structuredData.push({
          id: item.id,
          poll: item.poll,
          gpoll: item.gpoll,
          osnm: item.osnm,
          zip: item.zip,
          adr: item.adr,
          tel: item.tel,
          lpgyn: item.lpgyn,
          gisxcoor: katecX,
          gisycoor: katecY,
          lat: wgs84Coords.lat,
          lng: wgs84Coords.lng,
          gasoline: item.gasoline,
          premium_gasoline: item.premium_gasoline,
          diesel: item.diesel,
          lpg: item.lpg,
        });
      }
    }
    return structuredData;
  } catch (error) {
    console.error("Failed to parse JSON or transform data:", error);
    return [];
  }
};

// 제주 주유소 기본 정보 API 호출 함수
export const fetchFuelInfo = async () => {
  // 새 API 엔드포인트로 변경
  const apiUrl = 'https://grapserver.du.r.appspot.com/api/fuel-list';

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // 새로운 API는 표준 JSON을 반환한다고 가정하고 response.json() 사용
    const jsonData = await response.json(); 

    console.log('API 응답 데이터:', jsonData); 
    // API에서 받은 JSON 데이터를 그대로 반환 (필요시 가공 로직 추가)
    return jsonData; 

  } catch (error) {
    console.error("API 호출 또는 데이터 처리 중 오류 발생:", error); // 오류 메시지 명확화
    // 에러 발생 시 빈 배열 또는 적절한 기본값 반환 고려
    return []; // 또는 throw error; 로 변경하여 호출 측에서 처리
  }
};

// 제주 주유소 유가 정보 API 호출 함수
export const fetchFuelPrices = async () => {
  const apiCode = import.meta.env.VITE_FUEL_API_CODE;
  // 개발 환경에서는 프록시 경로 사용, 프로덕션 환경에서는 환경 변수 또는 기본 URL 사용
  const apiUrl = import.meta.env.DEV
    ? `https://grapserver.du.r.appspot.com/fuel-list?code=${apiCode}` // Corrected endpoint: fuel-list
    : `${import.meta.env.VITE_FUEL_API_BASE_URL || 'https://grapserver.du.r.appspot.com'}/fuel-list?code=${apiCode}`; // Corrected endpoint: fuel-list

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonText = await response.text();
    const jsonData = JSON.parse(jsonText);

    if (jsonData.result !== 'success' || !Array.isArray(jsonData.info)) {
      console.error("Invalid JSON data structure received from Price API:", jsonData);
      return {}; // 빈 객체 반환
    }

    // 주유소 ID를 키로 하는 가격 정보 객체 생성
    const priceMap = {};
    // Log the first item from the price API response to check structure
    jsonData.info.forEach(item => {
      priceMap[item.id] = {
        gasoline: item.gasoline,
        premium_gasoline: item.premium_gasoline,
        diesel: item.diesel,
        lpg: item.lpg,
      };
    });
    return priceMap;
  } catch (error) {
    console.error("Failed to fetch or process fuel prices:", error);
    throw error; // 에러를 다시 던져서 호출 측에서 처리하도록 함
  }
};
