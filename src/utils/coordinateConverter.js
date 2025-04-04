import proj4 from 'proj4';

// 좌표계 정의
// WGS84 (EPSG:4326) - 위도, 경도 (Longitude, Latitude 순서)

// KATEC (카텍) 좌표계 정의 - !!! 중요: API 제공처의 정확한 정의 확인 필요 !!!
// 아래는 일반적인 중부원점(Bessel) 기반 TM 좌표계(EPSG:2097 유사) 정의입니다.
// 제주도 데이터의 경우 제주 원점(EPSG:5179) 또는 다른 정의일 수 있습니다.
// EPSG:5179 (제주 원점, Bessel): '+proj=tmerc +lat_0=38 +lon_0=125 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs'
// EPSG:5181 (중부 원점, GRS80): '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs'
// EPSG:5186 (UTM-K, GRS80): '+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs' // <- 이 정의를 사용해봅니다.
// API 문서나 제공처에 문의하여 정확한 Proj4 문자열 또는 EPSG 코드를 확인하세요.
// proj4 객체에 좌표계 등록 (선택사항이지만, 명시적으로 정의하는 것이 좋음)
proj4.defs('KATEC', '+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43');
proj4.defs('WGS84', '+proj=longlat +datum=WGS84 +no_defs');

/**
 * KATEC 좌표를 WGS84 좌표(위도, 경도)로 변환합니다.
 * @param {number} katecX - KATEC X 좌표 (gisxcoor)
 * @param {number} katecY - KATEC Y 좌표 (gisycoor)
 * @returns {{lat: number, lng: number} | null} 변환된 WGS84 좌표 {lat, lng} 또는 오류 시 null
 */
export function convertKatecToWgs84(katecX, katecY) {
  if (typeof katecX !== 'number' || typeof katecY !== 'number') {
    console.error('Invalid KATEC coordinates provided:', katecX, katecY);
    return null;
  }

  try {
    // proj4 변환: KATEC -> WGS84
    // proj4는 [경도, 위도] 순서로 반환합니다.
    const [lng, lat] = proj4('KATEC', 'WGS84').forward([katecX, katecY]);

    // 유효한 숫자인지 확인
    if (isNaN(lat) || isNaN(lng)) {
      console.error('Coordinate conversion resulted in NaN:', { katecX, katecY });
      return null;
    }

    return { lat, lng };
  } catch (error) {
    console.error('Error during KATEC to WGS84 conversion:', error);
    return null;
  }
}