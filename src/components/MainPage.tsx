'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BusinessCard, Post } from '@/lib/categoryData';
import { supabase } from '@/lib/supabase';

interface MainPageProps {
  businessCards: BusinessCard[];
  posts: Post[];
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
      color: 'text-orange-500',
      posts: popularPosts,
    },
    {
      title: '업체찾기',
      color: 'text-blue-500',
      posts: businessCards.slice(0, 7).map(card => ({
        id: card.id,
        title: card.name,
        comment_count: undefined,
        onClick: () => card.link_url && window.open(card.link_url, '_blank'),
      })),
    },
    {
      title: '급구',
      color: 'text-blue-500',
      posts: getPostsByRegion('견적/의뢰-급구(긴급 의뢰)'),
    },
    {
      title: '시공문의',
      color: 'text-blue-500',
      posts: getPostsByRegion('견적/의뢰-시공문의'),
    },
    {
      title: '창업노하우',
      color: 'text-blue-500',
      posts: getPostsByRegion('노하우/정보-창업노하우'),
    },
    {
      title: '유머게시판',
      color: 'text-blue-500',
      posts: getPostsByRegion('커뮤니티-유머게시판'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto py-8 px-2">
        {/* 로고 + 슬로건 */}
        <div className="flex flex-col items-center mb-10">
          <div className="h-16 w-48 bg-white rounded-xl border shadow-sm flex items-center justify-center text-gray-400 text-lg font-bold mb-2">
            로고 자리
          </div>
          <div className="text-gray-500 text-sm tracking-tight">소상공인 장비/간판/인력 정보 플랫폼</div>
        </div>
        {/* 메인 그리드: 왼쪽 홍보업체, 오른쪽 2x3 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 왼쪽: 홍보중인 업체 */}
          <aside className="md:col-span-1">
            <h2 className="font-bold text-base mb-2 border-b border-gray-200 pb-1 tracking-tight text-blue-500">홍보중인 업체</h2>
            <ul>
              {businessCards.slice(0, 4).map(card => (
                <li
                  key={card.id}
                  className="flex items-center py-3 text-base text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
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
                  <h2 className={`font-bold text-base mb-2 border-b border-gray-200 pb-1 tracking-tight ${section.color}`}>{section.title}</h2>
                  <ul>
                    {section.posts.map((post: any) => (
                      <li
                        key={post.id}
                        className="flex items-center py-2 text-sm text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={post.onClick ? post.onClick : () => router.push(`/read/${post.id}`)}
                      >
                        <span className="flex-1 truncate">{post.title}</span>
                        {typeof post.comment_count === 'number' && (
                          <span className={`${section.title === '인기글' ? 'text-orange-500' : 'text-blue-500'} ml-2 text-xs`}>{post.comment_count}</span>
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