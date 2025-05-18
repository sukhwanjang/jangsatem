// 카테고리 데이터를 별도로 분리하여 관리합니다.

// 메인 카테고리와 서브 카테고리 데이터
export const categoryData: { [main: string]: string[] } = {
  업체추천: ["간판", "스카이", "인테리어", "전기설비", "철거", "프렌차이즈"],
  장사시작템: ["간판", "현수막", "배너", "기타출력물", "스카이", "인테리어", "전기설비", "철거", "프렌차이즈"],
  창업아이템: ["무인아이템", "유인아이템", "프렌차이즈", "신박아이템"],
  추천글: ["자유게시판 베스트", "유머게시판 베스트", "이런장사어때요 베스트"],
  커뮤니티: ["핫한게시물", "자유게시판", "유머게시판", "이런장사어때요?"],
  업종별토론: ["반려동물", "무인창업", "제조업", "음식", "쇼핑몰", "배달", "스마트스토어", "미용", "숙박업", "스크린", "헬스장", "편의점", "학원"],
  공지: ["공지사항"]
};

// 별도 게시판 데이터
export const extraBoards = ["자유게시판", "유머게시판", "내가게자랑", "온드리안", "메이플스토리"];

// 페이지당 항목 수
export const ITEMS_PER_PAGE = 18;

// 비즈니스 카드 및 게시물 인터페이스 정의
export interface BusinessCard {
  id: number;
  name: string;
  image_url?: string;
  region?: string;
  link_url?: string;
  created_at?: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  user_id: string;
  region: string;
  created_at?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  image_url?: string;
}

// 카드 뷰 헬퍼 함수
export const fillEmptyCards = <T extends object>(items: T[], total: number): (T | null)[] => {
  const filled: (T | null)[] = [...items];
  while (filled.length < total) filled.push(null);
  return filled;
};

// 비즈니스 카드 타입 가드
export const isBusinessCard = (item: any): item is BusinessCard => {
  return "name" in item;
}; 