'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { BusinessCard, Post, ITEMS_PER_PAGE, extraBoards, fillEmptyCards, isBusinessCard } from '@/lib/categoryData';
import WriteForm from './WriteForm';
import PostList from './PostList';

interface CategoryPageProps {
  selectedCategory: string;
  activeTab: string;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  businessCards: BusinessCard[];
  posts: Post[];
  user: User | null;
  isWriting: { [key: string]: boolean };
  setIsWriting: (fn: (prev: { [key: string]: boolean }) => { [key: string]: boolean }) => void;
  setNewPostContent: (content: string | File) => void;
  setPosts: (posts: Post[]) => void;
  setSelectedCategory: (category: string) => void;
  setActiveTab: (tab: string) => void;
  setView: (view: 'main' | 'category') => void;
}

export default function CategoryPage({
  selectedCategory,
  activeTab,
  currentPage,
  setCurrentPage,
  businessCards,
  posts,
  user,
  isWriting,
  setIsWriting,
  setNewPostContent,
  setPosts,
  setSelectedCategory,
  setActiveTab,
  setView
}: CategoryPageProps) {
  const router = useRouter();

  // 현재 선택된 카테고리에 맞는 지역 설정
  const currentRegion = extraBoards.includes(selectedCategory)
    ? selectedCategory
    : `${selectedCategory}-${activeTab}`;

  // 현재 지역에 해당하는 게시물만 필터링
  const filteredPosts = posts.filter((post) => post.region === currentRegion);
  
  // 총 페이지 수 계산
  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);

  return (
    <>
      {/* 선택된 카테고리에 해당하는 로고 보여주기 */}
      {(() => {
        const topLogo = businessCards.find(card => card.region === currentRegion && card.image_url);

        return topLogo ? (
          <div className="mb-6">
            <Image
              src={topLogo.image_url!}
              alt="카테고리 로고"
              width={300}
              height={100}
              className="mx-auto mb-4 object-contain"
            />
          </div>
        ) : null;
      })()}

      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-blue-600">
          {selectedCategory}{activeTab ? ` > ${activeTab}` : ''}
        </h1>
        {user && (
          <button
            onClick={() => {
              // 글쓰기 경로를 정확히 계산
              router.push(`/write/${encodeURIComponent(currentRegion)}`);
            }}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            글쓰기
          </button>
        )}
      </header>

      {isWriting[currentRegion] && (
        <WriteForm
          user={user}
          activeTab={activeTab}
          selectedCategory={selectedCategory}
          extraBoards={extraBoards}
          setPosts={setPosts}
          setNewPostContent={setNewPostContent}
          setSelectedCategory={setSelectedCategory}
          setActiveTab={setActiveTab}
          setView={setView}
          setIsWriting={setIsWriting}
        />
      )}

      {/* 게시글 목록 테이블 */}
      <div className="mb-6">
        <PostList 
          posts={filteredPosts} 
          currentCategory={`${selectedCategory}${activeTab ? ` > ${activeTab}` : ''}`}
        />
      </div>

      {/* 페이지네이션 */}
      {totalPages > 0 && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 rounded-full text-sm font-semibold border text-center ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-blue-100"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </>
  );
} 