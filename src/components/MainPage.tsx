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
    <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {/* 인기글 */}
      <section className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="font-bold text-lg mb-4">인기글</h2>
        <ul>
          {popularPosts.map(post => (
            <li key={post.id} className="py-2 border-b last:border-b-0 cursor-pointer" onClick={() => router.push(`/read/${post.id}`)}>
              <span className="font-medium text-sm line-clamp-1">{post.title}</span>
              <span className="ml-2 text-xs text-gray-400">♥ {post.like_count || 0}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 업체찾기 (비즈카드) */}
      <section className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="font-bold text-lg mb-4">업체찾기</h2>
        <div className="grid grid-cols-2 gap-4">
          {businessCards.slice(0, 4).map(card => (
            <a
              key={card.id}
              href={card.link_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="border rounded-xl p-3 text-center shadow-sm hover:shadow-md transition bg-white block cursor-pointer min-h-[120px]"
            >
              {card.image_url ? (
                <Image
                  src={card.image_url}
                  alt={card.name}
                  width={120}
                  height={80}
                  className="w-full h-20 object-cover rounded mb-2"
                />
              ) : (
                <div className="w-full h-20 bg-gray-100 rounded mb-2 flex items-center justify-center text-gray-400 text-sm">
                  이미지 없음
                </div>
              )}
              <p className="font-medium text-sm line-clamp-1">{card.name}</p>
              <p className="text-xs text-gray-500 mt-1">{card.region}</p>
            </a>
          ))}
        </div>
      </section>

      {/* 급구 */}
      <section className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="font-bold text-lg mb-4">급구</h2>
        <ul>
          {getPostsByRegion('견적/의뢰-급구(긴급 의뢰)').map(post => (
            <li key={post.id} className="py-2 border-b last:border-b-0 cursor-pointer" onClick={() => router.push(`/read/${post.id}`)}>
              <span className="font-medium text-sm line-clamp-1">{post.title}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 시공문의 */}
      <section className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="font-bold text-lg mb-4">시공문의</h2>
        <ul>
          {getPostsByRegion('견적/의뢰-시공문의').map(post => (
            <li key={post.id} className="py-2 border-b last:border-b-0 cursor-pointer" onClick={() => router.push(`/read/${post.id}`)}>
              <span className="font-medium text-sm line-clamp-1">{post.title}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 창업노하우 */}
      <section className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="font-bold text-lg mb-4">창업노하우</h2>
        <ul>
          {getPostsByRegion('노하우/정보-창업노하우').map(post => (
            <li key={post.id} className="py-2 border-b last:border-b-0 cursor-pointer" onClick={() => router.push(`/read/${post.id}`)}>
              <span className="font-medium text-sm line-clamp-1">{post.title}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 유머게시판 */}
      <section className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="font-bold text-lg mb-4">유머게시판</h2>
        <ul>
          {getPostsByRegion('커뮤니티-유머게시판').map(post => (
            <li key={post.id} className="py-2 border-b last:border-b-0 cursor-pointer" onClick={() => router.push(`/read/${post.id}`)}>
              <span className="font-medium text-sm line-clamp-1">{post.title}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
} 