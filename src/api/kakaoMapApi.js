// initKakaoMap 함수 및 KAKAO_API_KEY 상수 제거
// 스크립트 로딩은 useKakaoMap의 loadKakaoMapScript를 사용
import { useKakaoMap } from '../modules/fuel/composables/useKakaoMap'; // useKakaoMap import

// 주변 초등학교 검색 함수
export const searchNearbySchools = async (latitude, longitude, radius = 1000) => {
  try {
    // API 호출 전에 스크립트 및 'services' 라이브러리 로드 보장
    const { loadKakaoMapScript } = useKakaoMap(); // composable 호출하여 함수 가져오기
    await loadKakaoMapScript(['services']);

    if (!window.kakao?.maps?.services?.Places) { // Places 생성자 확인
      throw new Error('카카오 맵 Places 서비스를 사용할 수 없습니다');
    }

    return new Promise((resolve, reject) => {
      const places = new window.kakao.maps.services.Places();
      
      places.categorySearch(
        'SC4', // 초등학교 카테고리 코드
        (data, status, pagination) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const schools = data.map(school => ({
              name: school.place_name,
              distance: school.distance,
              address: school.road_address_name || school.address_name,
              lat: school.y,
              lng: school.x
            }));

            resolve({
              count: schools.length,
              schools: schools
            });
          } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
            resolve({ count: 0, schools: [] });
          } else {
            console.error('카카오 API 에러:', status);
            reject(new Error('학교 검색 실패 - ' + status));
          }
        },
        {
          location: new window.kakao.maps.LatLng(latitude, longitude),
          radius: radius,
          sort: window.kakao.maps.services.SortBy.DISTANCE
        }
      );
    });
  } catch (error) {
    console.error('searchNearbySchools 에러:', error);
    throw error;
  }
};

// 주변 병원 검색 함수
export const searchNearbyHospitals = async (latitude, longitude, radius = 1000) => {
  try { // try-catch 블록 추가
    // API 호출 전에 스크립트 및 'services' 라이브러리 로드 보장
    const { loadKakaoMapScript } = useKakaoMap(); // composable 호출하여 함수 가져오기
    await loadKakaoMapScript(['services']);

    if (!window.kakao?.maps?.services?.Places) { // Places 생성자 확인
      throw new Error('카카오 맵 Places 서비스를 사용할 수 없습니다');
    }

    return new Promise((resolve, reject) => {
      const places = new window.kakao.maps.services.Places();
      const options = {
        location: new window.kakao.maps.LatLng(latitude, longitude),
        radius: radius,
        sort: window.kakao.maps.services.SortBy.DISTANCE
      };

      places.categorySearch('HP8', (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          resolve(result);
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          resolve([]);
        } else {
          reject(new Error('병원 검색 실패'));
        }
      }, options);
    });
  } catch (error) { // catch 블록 추가
    console.error('searchNearbyHospitals 에러:', error);
    throw error; // 에러 다시 던지기
  }
};
