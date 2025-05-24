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

  // 3단 그리드 섹션 데이터
  const sections = [
    {
      title: '인기글',
      color: 'text-orange-500',
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
        region: card.region,
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
    <div className="max-w-7xl mx-auto py-6 px-2 bg-white grid grid-cols-1 md:grid-cols-3 gap-2">
      {sections.map((section, idx) => (
        <section
          key={section.title}
          className={`px-2 ${idx % 3 !== 2 ? 'md:border-r' : ''}`}
        >
          <h2 className={`font-bold text-base mb-1 border-b pb-1 ${section.color}`}>{section.title}</h2>
          <ul>
            {section.posts.map((post: any) => (
              <li
                key={post.id}
                className="flex items-center py-1 text-xs hover:bg-gray-100 cursor-pointer"
                onClick={post.onClick ? post.onClick : () => router.push(`/read/${post.id}`)}
              >
                <span className="flex-1 truncate">{post.title}</span>
                {typeof post.comment_count === 'number' && (
                  <span className={`${section.title === '인기글' ? 'text-orange-500' : 'text-blue-500'} ml-2 text-xs`}>{post.comment_count}</span>
                )}
                {post.region && section.title === '업체찾기' && (
                  <span className="ml-2 text-gray-400 text-xs">{post.region}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
} 