'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { BusinessCard, Post, ITEMS_PER_PAGE, extraBoards, fillEmptyCards, isBusinessCard, categoryData } from '@/lib/categoryData';
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

  // 필터링 로직 업데이트: activeTab이 없으면 해당 메인 카테고리의 모든 서브카테고리 게시물 표시
  let filteredPosts: Post[];
  
  if (extraBoards.includes(selectedCategory)) {
    // extraBoards에 있는 카테고리는 그대로 필터링
    filteredPosts = posts.filter((post) => post.region === selectedCategory);
  } else if (!activeTab && categoryData[selectedCategory]) {
    // 메인 카테고리만 선택되고 서브 카테고리가 선택되지 않은 경우
    // 해당 메인 카테고리에 속한 모든 서브카테고리의 게시물 필터링
    const subCategories = categoryData[selectedCategory];
    filteredPosts = posts.filter((post) => {
      // 정확히 "메인카테고리-서브카테고리" 형태의 region을 가진 게시물만 필터링
      return subCategories.some(sub => post.region === `${selectedCategory}-${sub}`);
    });
  } else {
    // 서브 카테고리가 선택된 경우는 기존 방식대로 필터링
    filteredPosts = posts.filter((post) => post.region === currentRegion);
  }
  
  // 필터링된 게시물 정렬 (최신순)
  filteredPosts = [...filteredPosts].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
  
  // 총 페이지 수 계산
  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);

  // 현재 페이지에 표시할 게시물
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

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

      {/* 인기글과 카테고리 버튼을 상단에 배치 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            // 인기 게시글로 이동하는 로직
            router.push(`/?category=커뮤니티&tab=핫한게시물`);
          }}
          className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300 cursor-pointer"
        >
          인기글
        </button>
        <button
          onClick={() => {
            // 현재 카테고리의 전체 게시판으로 이동
            router.push(`/?category=${selectedCategory}`);
          }}
          className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300 cursor-pointer"
        >
          {selectedCategory}
        </button>
      </div>

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
          posts={paginatedPosts} 
          currentCategory={activeTab || '전체게시판'}
        />
      </div>

      {/* 글쓰기 버튼은 계속 하단에 유지 */}
      <div className="flex justify-end mb-4">
        {user && (
          <button
            onClick={() => {
              // 글쓰기는 서브카테고리가 선택되어 있을 때만 가능
              if (!activeTab && !extraBoards.includes(selectedCategory)) {
                alert('글을 작성하려면 서브카테고리를 선택해주세요.');
                return;
              }
              router.push(`/write/${encodeURIComponent(currentRegion)}`);
            }}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 cursor-pointer"
          >
            글쓰기
          </button>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 0 && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 rounded-full text-sm font-semibold border text-center cursor-pointer ${
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