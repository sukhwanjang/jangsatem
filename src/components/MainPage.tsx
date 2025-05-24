'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BusinessCard, Post, extraBoards, fillEmptyCards, isBusinessCard } from '@/lib/categoryData';
import { supabase } from '@/lib/supabase';

interface MainPageProps {
  businessCards: BusinessCard[];
  posts: Post[];
}

export default function MainPage({ businessCards, posts }: MainPageProps) {
  const router = useRouter();
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [notices, setNotices] = useState<{ id: number; title: string }[]>([]);
  const [hotPosts, setHotPosts] = useState<Post[]>([]);

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
      setPopularPosts(sorted);
      setHotPosts(sorted.slice(0, 10)); // 실시간 인기글(더쿠 스타일)
    };
    fetchPopularPosts();
  }, [posts]);

  useEffect(() => {
    // 공지사항 예시 데이터 (실제 DB 연동 시 수정)
    setNotices([
      { id: 1, title: '장사템 오픈 이벤트 안내' },
      { id: 2, title: '광고/제휴 문의는 고객센터로!' },
    ]);
  }, []);

  return (
    <div className="w-full">
      {/* 병렬 배치: 업체 포트폴리오(비즈카드) / 인기글 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        {/* 업체 포트폴리오(비즈카드) */}
        <section>
          <h2 className="font-bold text-lg mb-4">업체 포트폴리오</h2>
          <div className="grid grid-cols-2 gap-4">
            {fillEmptyCards(businessCards.slice(0, 4), 4).map((card, i) => (
              <a
                key={i}
                href={card?.link_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="border rounded-lg p-3 text-center shadow-sm hover:shadow-md transition bg-white block cursor-pointer min-h-[180px]"
              >
                {card ? (
                  <>
                    {card.image_url && typeof card.image_url === 'string' ? (
                      <Image
                        src={card.image_url}
                        alt={card.name}
                        width={200}
                        height={120}
                        className="w-full h-28 object-cover rounded mb-2"
                      />
                    ) : (
                      <div className="w-full h-28 bg-gray-100 rounded mb-2 flex items-center justify-center text-gray-400 text-sm">
                        이미지 없음
                      </div>
                    )}
                    <p className="font-medium text-sm line-clamp-1">{card.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{card.region}</p>
                  </>
                ) : (
                  <div className="w-full h-28 bg-gray-100 rounded flex items-center justify-center text-gray-300">
                    빈칸
                  </div>
                )}
              </a>
            ))}
          </div>
          <a href="/portfolio" className="block text-right text-blue-500 mt-2 text-sm">더보기</a>
        </section>
        {/* 인기글(커뮤니티) */}
        <section>
          <h2 className="font-bold text-lg mb-4">인기글</h2>
          <div className="bg-white border rounded-lg overflow-hidden divide-y">
            {popularPosts.slice(0, 5).map((post) => (
              <div
                key={post.id}
                className="px-5 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/read/${Number(post.id)}`)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded">인기</span>
                  <span className="font-medium text-sm line-clamp-1">{post.title}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>댓글 {post.comment_count || 0}</span>
                  <span>· 조회 {post.view_count || 0}</span>
                  <span>· ♥ {post.like_count || 0}</span>
                  <span className="ml-auto">{post.created_at?.substring(0, 10)}</span>
                </div>
              </div>
            ))}
          </div>
          <a href="/community" className="block text-right text-blue-500 mt-2 text-sm">더보기</a>
        </section>
      </div>

      {/* 공지/이벤트 섹션 */}
      <section className="bg-blue-50 rounded-lg p-5 mb-12">
        <h3 className="font-semibold mb-2">공지사항</h3>
        <ul className="list-disc pl-5 text-sm">
          {notices.map(notice => (
            <li key={notice.id}>{notice.title}</li>
          ))}
        </ul>
      </section>

      {/* 실시간 인기글(더쿠 스타일) */}
      <section className="my-8">
        <h2 className="font-bold text-lg mb-4">실시간 인기글</h2>
        <ul>
          {hotPosts.map(post => (
            <li key={post.id} className="py-2 border-b last:border-b-0">
              <a href={`/read/${post.id}`} className="hover:underline text-sm">
                {post.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
} 