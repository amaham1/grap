// next/font 내장 기능을 사용합니다
import { Inter } from 'next/font/google';

// Pretendard 폰트를 사용하기 위한 CSS 변수 설정
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

// 참고: Pretendard는 Google Fonts에 없으므로 CDN을 통해 globals.css에서 불러옵니다.
