import axios, { AxiosRequestConfig } from 'axios';

/**
 * 페이징 API를 반복 호출하여 모든 데이터를 조회합니다.
 * @param urlGenerator 페이지 번호를 받아 호출할 URL을 반환하는 함수
 * @param extractItems 응답 데이터에서 항목 배열을 추출하는 함수
 * @param axiosConfig Axios 요청 옵션 (XML 등 특수 처리 시 사용)
 * @returns 모든 페이지의 항목을 합친 배열
 */
export async function fetchAllPages<T>(
  urlGenerator: (page: number) => string,
  extractItems: (data: any) => Promise<T[]> | T[],
  axiosConfig?: AxiosRequestConfig
): Promise<T[]> {
  let page = 1;
  const allItems: T[] = [];

  while (true) {
    const url = urlGenerator(page);
    const res = await axios.get(url, axiosConfig);
    const data = res.data;
    const items = await Promise.resolve(extractItems(data));
    if (!items || items.length === 0) break;
    allItems.push(...items);
    page++;
  }

  return allItems;
}
