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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {fillEmptyCards(businessCards.slice(0, 4), 4).map((card, i) => (
            <a
              key={i}
              href={card?.link_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="border rounded-lg p-2 text-center shadow-sm hover:shadow-md transition bg-white block"
            >
              {card ? (
                <>
                  {card.image_url && typeof card.image_url === 'string' ? (
                    <Image
                      src={card.image_url}
                      alt={card.name}
                      width={200}
                      height={120}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded mb-2 flex items-center justify-center text-gray-400 text-sm">
                      이미지 없음
                    </div>
                  )}
                  <p className="font-medium text-sm line-clamp-1">{card.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.region}</p>
                </>
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center text-gray-300">
                  빈칸
                </div>
              )}
            </a>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold">자유게시판 베스트</h2>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <tbody>
              {posts.filter(p => p.region === "자유게시판").slice(0, 5).map((post) => (
                <tr 
                  key={post.id} 
                  className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/read/${Number(post.id)}`)}
                >
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700 line-clamp-1">{post.title}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-500">댓글 {post.comment_count || 0}</span>
                      <span className="text-xs text-gray-400 mx-1">•</span>
                      <span className="text-xs text-gray-500">조회 {post.view_count || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end">
                      <span className="text-xs text-gray-500">{post.created_at?.substring(0, 10)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold">유머게시판 베스트</h2>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <tbody>
              {posts.filter(p => p.region === "유머게시판").slice(0, 5).map((post) => (
                <tr 
                  key={post.id} 
                  className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/read/${Number(post.id)}`)}
                >
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700 line-clamp-1">{post.title}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-500">댓글 {post.comment_count || 0}</span>
                      <span className="text-xs text-gray-400 mx-1">•</span>
                      <span className="text-xs text-gray-500">조회 {post.view_count || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end">
                      <span className="text-xs text-gray-500">{post.created_at?.substring(0, 10)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
} 