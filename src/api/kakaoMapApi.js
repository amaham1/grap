// 카카오 맵 API 키 설정
const KAKAO_API_KEY = '8cd504181320fe1b5e9f810c1792f876'; // 실제 API 키로 교체 필요

// 카카오 맵 SDK 초기화
let initialized = false;

export const initKakaoMap = () => {
  if (initialized) return Promise.resolve();
  
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_API_KEY}&libraries=services&autoload=false`;
    script.async = true;
    
    script.onload = () => {
      window.kakao.maps.load(() => {
        if (window.kakao.maps.services) {
          initialized = true;
          console.log('카카오 맵 SDK 초기화 완료');
          resolve();
        } else {
          console.error('카카오 맵 services 로드 실패');
          throw new Error('카카오 맵 services 로드 실패');
        }
      });
    };

    script.onerror = (error) => {
      console.error('카카오 맵 스크립트 로드 실패:', error);
      throw new Error('카카오 맵 스크립트 로드 실패');
    };
    
    document.head.appendChild(script);
  });
};

// 주변 초등학교 검색 함수
export const searchNearbySchools = async (latitude, longitude, radius = 1000) => {
  try {
    await initKakaoMap();

    if (!window.kakao?.maps?.services) {
      throw new Error('카카오 맵 services를 사용할 수 없습니다');
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
  if (!initialized) {
    await initKakaoMap();
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
};
