'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BusinessCard, Post, extraBoards, fillEmptyCards, isBusinessCard } from '@/lib/categoryData';

interface MainPageProps {
  businessCards: BusinessCard[];
  posts: Post[];
}

export default function MainPage({ businessCards, posts }: MainPageProps) {
  const router = useRouter();

  return (
    <>
      <section>
        <h2 className="text-base font-semibold mb-3">💼 입점 대기 중인 홍보 업체</h2>
        <div className="flex flex-wrap gap-2 justify-start">
          {fillEmptyCards(businessCards.slice(0, 63), 63).map((card, i) => (
            <a
              key={i}
              href={card?.link_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-[100px] h-[100px] border rounded-sm p-1 text-center shadow-sm hover:shadow-md transition bg-white block"
            >
              {card ? (
                <>
                  {card.image_url && typeof card.image_url === 'string' ? (
                    <Image
                      src={card.image_url}
                      alt={card.name}
                      width={100}
                      height={55}
                      className="w-full h-[55%] object-cover rounded mb-0.5"
                    />
                  ) : (
                    <div className="w-full h-[55%] bg-gray-100 rounded mb-0.5 flex items-center justify-center text-gray-300 text-[9px]">
                      이미지 없음
                    </div>
                  )}
                  <p className="font-medium text-[10px] truncate">{card.name}</p>
                  <p className="text-[9px] text-gray-500">{card.region}</p>
                </>
              ) : (
                <div className="w-full h-full bg-gray-100 rounded" />
              )}
            </a>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold mb-4 text-gray-800">🔥 커뮤니티 최신글</h2>
        <div className="grid grid-cols-3 gap-6">
          {/* 자유게시판 */}
          <div className="bg-white border rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold mb-2 text-blue-600">자유게시판</h3>
            <ul className="space-y-2">
              {posts.filter(p => p.region === "자유게시판").slice(0, 3).map((post) => (
                <li 
                  key={post.id} 
                  className="text-sm text-gray-700 hover:underline cursor-pointer"
                  onClick={() => router.push(`/read/${Number(post.id)}`)}
                >
                  {post.title}
                </li>
              ))}
            </ul>
          </div>

          {/* 유머게시판 */}
          <div className="bg-white border rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold mb-2 text-pink-600">유머게시판</h3>
            <ul className="space-y-2">
              {posts.filter(p => p.region === "유머게시판").slice(0, 3).map((post) => (
                <li 
                  key={post.id} 
                  className="text-sm text-gray-700 hover:underline cursor-pointer"
                  onClick={() => router.push(`/read/${Number(post.id)}`)}
                >
                  {post.title}
                </li>
              ))}
            </ul>
          </div>

          {/* 내가게자랑 */}
          <div className="bg-white border rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold mb-2 text-green-600">내가게자랑</h3>
            <ul className="space-y-2">
              {posts.filter(p => p.region === "내가게자랑").slice(0, 3).map((post) => (
                <li 
                  key={post.id} 
                  className="text-sm text-gray-700 hover:underline cursor-pointer"
                  onClick={() => router.push(`/read/${Number(post.id)}`)}
                >
                  {post.title}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
} 