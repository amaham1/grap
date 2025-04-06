/**
 * localStorage에서 캐시된 데이터를 가져옵니다.
 * @param {string} key - 캐시 키
 * @param {number} duration - 캐시 유효 기간 (밀리초)
 * @returns {any | null} 캐시된 데이터 또는 null
 */
export const getCachedData = (key, duration) => {
  const cachedString = localStorage.getItem(key);
  if (!cachedString) {
    console.log(`Cache [${key}] is empty.`);
    return null;
  }

  try {
    const parsedCache = JSON.parse(cachedString);
    const { timestamp, data } = parsedCache;

    if (Date.now() - timestamp < duration) {
      console.log(`Cache [${key}] is valid. Using cached data.`);
      return data;
    } else {
      console.log(`Cache [${key}] expired.`);
      localStorage.removeItem(key);
      return null;
    }
  } catch (error) {
    console.error(`Failed to parse cached data for key [${key}]:`, error);
    localStorage.removeItem(key);
    return null;
  }
};

/**
 * 데이터를 localStorage에 캐싱합니다.
 * @param {string} key - 캐시 키
 * @param {any} data - 캐싱할 데이터
 */
export const cacheData = (key, data) => {
  try {
    const cacheEntry = {
      timestamp: Date.now(),
      data: data
    };
    localStorage.setItem(key, JSON.stringify(cacheEntry));
    console.log(`Data cached successfully for key [${key}].`);
  } catch (error) {
    console.error(`Failed to cache data for key [${key}]:`, error);
  }
};