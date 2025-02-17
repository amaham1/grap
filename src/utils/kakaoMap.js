// src/utils/kakaoMap.js
export const openKakaoMap = (name, prefix = '제주') => {
    const mapUrl = `https://map.kakao.com/link/search/${prefix}${encodeURIComponent(name)}`;
    window.open(mapUrl, '_blank');
  };