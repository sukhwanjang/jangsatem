// 카테고리 데이터를 별도로 분리하여 관리합니다.

// 메인 카테고리와 서브 카테고리 데이터
export const categoryData = [
  {
    group: "업체찾기",
    items: [
      { label: "간판" },
      { label: "현수막" },
      { label: "배너/출력물" },
      { label: "인테리어" },
      { label: "전기설비" },
      { label: "철거/시공" },
      { label: "프렌차이즈", highlight: true },
      { label: "스카이/장비" }
    ]
  },
  {
    group: "견적/의뢰",
    items: [
      { label: "간판의뢰" },
      { label: "현수막의뢰" },
      { label: "인테리어의뢰" },
      { label: "기타출력/시공" },
      { label: "급구(긴급 의뢰)", highlight: true },
      { label: "시공문의" },
      { label: "무료상담" }
    ]
  },
  {
    group: "창업템 추천",
    items: [
      { label: "무인아이템" },
      { label: "유인아이템" },
      { label: "프렌차이즈", highlight: true },
      { label: "트렌드템" },
      { label: "신규아이템" }
    ]
  },
  {
    group: "노하우/정보",
    items: [
      { label: "창업노하우" },
      { label: "사업운영팁" },
      { label: "세무/법률" },
      { label: "마케팅/광고" },
      { label: "정책/지원금", highlight: true }
    ]
  },
  {
    group: "커뮤니티",
    items: [
      { label: "자유게시판" },
      { label: "유머게시판" },
      { label: "이런장사어때요?" },
      { label: "HOT게시물", highlight: true },
      { label: "내 가게 자랑" }
    ]
  },
  {
    group: "업종별 토론",
    items: [
      { label: "반려동물" },
      { label: "제조업" },
      { label: "음식/식당" },
      { label: "쇼핑몰" },
      { label: "배달/물류" },
      { label: "인테리어/시공" },
      { label: "스마트스토어" },
      { label: "미용/뷰티" },
      { label: "학원/교육" }
    ]
  },
  {
    group: "공지/이벤트",
    items: [
      { label: "사이트 공지" },
      { label: "이벤트", highlight: true },
      { label: "업데이트/패치" }
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
  id: string;
  title: string;
  content: string;
  author: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  region: string;
  category: string;
  views: number;
  view_count: number;
  like_count: number;
  comment_count: number;
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

// 메인 카테고리 목록
export const mainCategories = [
  '업체찾기',
  '견적/의뢰',
  '노하우/정보',
  '커뮤니티',
  '지역별',
  '홍보',
  '공지사항'
]; 