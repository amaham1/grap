// 외부 전시회 타입
export interface ExternalExhibition {
  id: string;
  title: string;
  intro: string;
  content: string;
  place: string;
  owner: string;
  tel: string;
  homepage: string;
  startDate: Date | null;
  endDate: Date | null;
  hour: string;
  fee: string;
  coverThumb?: string;
  coverImage?: string;
  categoryName?: string;
  stat: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  [key: string]: any;
}

// 복지 서비스 타입
export interface WelfareService {
  id: string;
  name: string;
  contents: string;
  target: string;
  howto: string;
  tel: string;
  homepage: string;
  address: string;
  lat: number | null;
  lng: number | null;
  [key: string]: any;
}

// 제주 행사 타입
export interface JejuEvent {
  id: string;
  title: string;
  contents: string;
  place: string;
  organizer: string;
  tel: string;
  homepage: string;
  startDate: Date | null;
  endDate: Date | null;
  writeDate: Date | null;
  [key: string]: any;
}

// 데이터 섹션 프롭스 타입
export interface DataSectionProps {
  title: string;
  data: ExternalExhibition[] | WelfareService[] | JejuEvent[] | null;
  type: 'exhibition' | 'welfare' | 'jeju';
  color?: 'indigo' | 'emerald' | 'blue' | 'gray';
  id?: string;
}
