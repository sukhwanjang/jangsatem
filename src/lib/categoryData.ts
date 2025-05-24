// 카테고리 데이터를 별도로 분리하여 관리합니다.

// 메인 카테고리와 서브 카테고리 데이터
export const categoryData = [
  {
    group: "업체찾기",
    categories: [
      "간판",
      "현수막",
      "배너/출력물",
      "인테리어",
      "전기설비",
      "철거/시공",
      "프렌차이즈",
      "스카이/장비"
    ]
  },
  {
    group: "견적/의뢰",
    categories: [
      "간판의뢰",
      "현수막의뢰",
      "인테리어의뢰",
      "기타출력/시공",
      "급구(긴급 의뢰)",
      "시공문의",
      "무료상담"
    ]
  },
  {
    group: "창업템 추천",
    categories: [
      "무인아이템",
      "유인아이템",
      "프렌차이즈",
      "트렌드템",
      "신규아이템"
    ]
  },
  {
    group: "노하우/정보",
    categories: [
      "창업노하우",
      "사업운영팁",
      "세무/법률",
      "마케팅/광고",
      "정책/지원금"
    ]
  },
  {
    group: "커뮤니티",
    categories: [
      "자유게시판",
      "유머게시판",
      "이런장사어때요?",
      "HOT게시물",
      "내 가게 자랑"
    ]
  },
  {
    group: "업종별 토론",
    categories: [
      "반려동물",
      "제조업",
      "음식/식당",
      "쇼핑몰",
      "배달/물류",
      "인테리어/시공",
      "스마트스토어",
      "미용/뷰티",
      "학원/교육"
    ]
  },
  {
    group: "공지/이벤트",
    categories: [
      "사이트 공지",
      "이벤트",
      "업데이트/패치"
    ]
  }
];

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