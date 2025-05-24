'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
      setPopularPosts(sorted.slice(0, 5));
    };
    fetchPopularPosts();
  }, [posts]);

  // 카테고리별 필터링
  const getPostsByRegion = (region: string) => posts.filter(post => post.region === region).slice(0, 5);

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* 인기글 */}
      <section className="mb-8">
        <h2 className="font-bold text-base text-blue-600 mb-2">인기글</h2>
        <ul>
          {popularPosts.map(post => (
            <li key={post.id} className="flex items-center py-2 border-b last:border-b-0 text-sm hover:bg-gray-100 cursor-pointer" onClick={() => router.push(`/read/${post.id}`)}>
              <span className="flex-1 truncate">{post.title}</span>
              {typeof post.comment_count === 'number' && (
                <span className="ml-2 text-blue-500 text-xs">{post.comment_count}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* 업체찾기 (비즈카드) */}
      <section className="mb-8">
        <h2 className="font-bold text-base text-blue-600 mb-2">업체찾기</h2>
        <ul>
          {businessCards.slice(0, 5).map(card => (
            <li key={card.id} className="flex items-center py-2 border-b last:border-b-0 text-sm hover:bg-gray-100 cursor-pointer" onClick={() => card.link_url && window.open(card.link_url, '_blank') }>
              <span className="flex-1 truncate">{card.name}</span>
              {card.region && <span className="ml-2 text-gray-400 text-xs">{card.region}</span>}
            </li>
          ))}
        </ul>
      </section>

      {/* 급구 */}
      <section className="mb-8">
        <h2 className="font-bold text-base text-blue-600 mb-2">급구</h2>
        <ul>
          {getPostsByRegion('견적/의뢰-급구(긴급 의뢰)').map(post => (
            <li key={post.id} className="flex items-center py-2 border-b last:border-b-0 text-sm hover:bg-gray-100 cursor-pointer" onClick={() => router.push(`/read/${post.id}`)}>
              <span className="flex-1 truncate">{post.title}</span>
              {typeof post.comment_count === 'number' && (
                <span className="ml-2 text-blue-500 text-xs">{post.comment_count}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* 시공문의 */}
      <section className="mb-8">
        <h2 className="font-bold text-base text-blue-600 mb-2">시공문의</h2>
        <ul>
          {getPostsByRegion('견적/의뢰-시공문의').map(post => (
            <li key={post.id} className="flex items-center py-2 border-b last:border-b-0 text-sm hover:bg-gray-100 cursor-pointer" onClick={() => router.push(`/read/${post.id}`)}>
              <span className="flex-1 truncate">{post.title}</span>
              {typeof post.comment_count === 'number' && (
                <span className="ml-2 text-blue-500 text-xs">{post.comment_count}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* 창업노하우 */}
      <section className="mb-8">
        <h2 className="font-bold text-base text-blue-600 mb-2">창업노하우</h2>
        <ul>
          {getPostsByRegion('노하우/정보-창업노하우').map(post => (
            <li key={post.id} className="flex items-center py-2 border-b last:border-b-0 text-sm hover:bg-gray-100 cursor-pointer" onClick={() => router.push(`/read/${post.id}`)}>
              <span className="flex-1 truncate">{post.title}</span>
              {typeof post.comment_count === 'number' && (
                <span className="ml-2 text-blue-500 text-xs">{post.comment_count}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* 유머게시판 */}
      <section className="mb-8">
        <h2 className="font-bold text-base text-blue-600 mb-2">유머게시판</h2>
        <ul>
          {getPostsByRegion('커뮤니티-유머게시판').map(post => (
            <li key={post.id} className="flex items-center py-2 border-b last:border-b-0 text-sm hover:bg-gray-100 cursor-pointer" onClick={() => router.push(`/read/${post.id}`)}>
              <span className="flex-1 truncate">{post.title}</span>
              {typeof post.comment_count === 'number' && (
                <span className="ml-2 text-blue-500 text-xs">{post.comment_count}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
} 