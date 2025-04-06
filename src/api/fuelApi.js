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
  const apiUrl = '/api/its/api/infoGasInfoList?code=860665';
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonText = await response.text();
    const structuredData = parseAndTransformFuelData(jsonText);
    return structuredData;
  } catch (error) {
    console.error("Failed to fetch or process fuel info:", error);
    throw error; // 에러를 다시 던져서 호출 측에서 처리하도록 함
  }
};

// 제주 주유소 유가 정보 API 호출 함수
export const fetchFuelPrices = async () => {
  const apiUrl = '/api/its/api/infoGasPriceList?code=860665';
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