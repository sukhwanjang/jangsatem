'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BusinessCard, Post } from '@/lib/categoryData';
import { supabase } from '@/lib/supabase';

interface MainPageProps {
  businessCards: BusinessCard[];
  posts: Post[];
}

// 1. 홍보업체 카드 데이터 (이미지 경로는 public/images/에 넣으면 됨)
const promotedBusinesses = [
  {
    id: '1',
    name: '홍보문의',
    image: '/images/promo1.png',
    description: '문의주세요',
    link_url: 'https://yourbusiness1.com',
  },
  {
    id: '2',
    name: '홍보문의',
    image: '/images/promo2.png',
    description: '문의주세요',
    link_url: 'https://yourbusiness2.com',
  },
  {
    id: '3',
    name: '홍보문의',
    image: '/images/promo3.png',
    description: '문의주세요',
    link_url: 'https://yourbusiness3.com',
  },
  {
    id: '4',
    name: '홍보문의',
    image: '/images/promo4.png',
    description: '문의주세요',
    link_url: 'https://yourbusiness4.com',
  },
  {
    id: '5',
    name: '홍보문의',
    image: '/images/promo5.png',
    description: '문의주세요',
    link_url: 'https://yourbusiness5.com',
  },
  {
    id: '6',
    name: '홍보문의',
    image: '/images/promo6.png',
    description: '문의주세요',
    link_url: 'https://yourbusiness6.com',
  },
];

// 2. 홍보업체 카드 컴포넌트 (인라인)
function PromotedBusinessCard({ business }: { business: typeof promotedBusinesses[0] }) {
  return (
    <div
      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer flex flex-col border border-gray-100"
      onClick={() => window.open(business.link_url, '_blank')}
    >
      <div className="relative w-full aspect-[16/9] bg-gray-100">
        {/* 이미지 비율 16:9, 이미지 없으면 회색 배경 */}
        <img
          src={business.image}
          alt={business.name}
          className="object-cover w-full h-full"
        />
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-bold text-base text-black mb-1 truncate">{business.name}</h3>
        <p className="text-sm text-gray-600 flex-1 truncate">{business.description}</p>
      </div>
    </div>
  );
}

export default function MainPage({ businessCards, posts }: MainPageProps) {
  const router = useRouter();
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);

  useEffect(() => {
    // 인기글(좋아요순)
    const fetchPopularPosts = async () => {
      const postsWithLikes = await Promise.all(
        posts.map(async (post) => {
          const { data: likes } = await supabase
            .from('likes')
            .select('*')
            .eq('post_id', post.id);
          return {
            ...post,
            like_count: likes?.length || 0
          };
        })
      );
      const sorted = [...postsWithLikes].sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
      setPopularPosts(sorted.slice(0, 7));
    };
    fetchPopularPosts();
  }, [posts]);

  // 카테고리별 필터링
  const getPostsByRegion = (region: string) => posts.filter(post => post.region === region).slice(0, 7);

  // 2x3 그리드 섹션 데이터
  const sections = [
    {
      title: '인기글',
      color: 'text-black',
      posts: popularPosts,
    },
    {
      title: '업체찾기',
      color: 'text-black',
      posts: businessCards.slice(0, 7).map(card => ({
        id: card.id,
        title: card.name,
        comment_count: undefined,
        onClick: () => card.link_url && window.open(card.link_url, '_blank'),
      })),
    },
    {
      title: '급구',
      color: 'text-black',
      posts: getPostsByRegion('견적/의뢰-급구(긴급 의뢰)'),
    },
    {
      title: '시공문의',
      color: 'text-black',
      posts: getPostsByRegion('견적/의뢰-시공문의'),
    },
    {
      title: '창업노하우',
      color: 'text-black',
      posts: getPostsByRegion('노하우/정보-창업노하우'),
    },
    {
      title: '유머게시판',
      color: 'text-black',
      posts: getPostsByRegion('커뮤니티-유머게시판'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto py-8 px-2">
        {/* 배너 아래 홍보업체 네모카드 (6개, 참고 이미지처럼) */}
        <div className="w-full mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {promotedBusinesses.map(biz => (
              <PromotedBusinessCard key={biz.id} business={biz} />
            ))}
          </div>
        </div>
        {/* 로고 + 슬로건 제거됨 */}
        {/* 메인 그리드: 왼쪽 홍보업체, 오른쪽 2x3 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 왼쪽: 홍보중인 업체 */}
          <aside className="md:col-span-1">
            <h2 className="font-bold text-base mb-2 border-b border-gray-200 pb-1 tracking-tight text-black">홍보중인 업체</h2>
            <ul>
              {businessCards.slice(0, 4).map(card => (
                <li
                  key={card.id}
                  className="flex items-center py-3 text-base text-black hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => card.link_url && window.open(card.link_url, '_blank')}
                >
                  <span className="flex-1 truncate font-semibold">{card.name}</span>
                </li>
              ))}
            </ul>
          </aside>
          {/* 오른쪽: 2x3 섹션 */}
          <main className="md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {sections.map((section, idx) => (
                <section
                  key={section.title}
                  className={`px-2 border-b border-gray-200 pb-6 mb-2 last:border-b-0`}
                >
                  <h2 className={`font-bold text-base mb-2 border-b border-gray-200 pb-1 tracking-tight text-black`}>{section.title}</h2>
                  <ul>
                    {section.posts.map((post: any) => (
                      <li
                        key={post.id}
                        className="flex items-center py-2 text-sm text-black hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={post.onClick ? post.onClick : () => router.push(`/read/${post.id}`)}
                      >
                        <span className="flex-1 truncate">{post.title}</span>
                        {typeof post.comment_count === 'number' && (
                          <span className={`ml-2 text-xs text-black`}>{post.comment_count}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 