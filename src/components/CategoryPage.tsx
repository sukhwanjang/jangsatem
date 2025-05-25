'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { BusinessCard, Post, ITEMS_PER_PAGE, extraBoards, fillEmptyCards, isBusinessCard, categoryData, mainCategories } from '@/lib/categoryData';
import WriteForm from './WriteForm';
import PostList from './PostList';
import { supabase } from '@/lib/supabase';

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
  let [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [currentCategory, setCurrentCategory] = useState(selectedCategory);
  const [currentTab, setCurrentTab] = useState(activeTab);

  useEffect(() => {
    setCurrentCategory(selectedCategory);
    setCurrentTab(activeTab);
  }, [selectedCategory, activeTab]);

  useEffect(() => {
    if (currentCategory) {
      // 메인 카테고리만 선택된 경우 (서브카테고리 미선택)
      if (!currentTab) {
        // 해당 메인 카테고리의 모든 서브카테고리 글을 필터링
        const mainCategoryPosts = posts.filter(post => {
          const [mainCat] = post.category.split('-');
          return mainCat === currentCategory;
        });
        setFilteredPosts(mainCategoryPosts);
      } else {
        // 특정 서브카테고리가 선택된 경우
        const subCategoryPosts = posts.filter(post => post.category === `${currentCategory}-${currentTab}`);
        setFilteredPosts(subCategoryPosts);
      }
    } else {
      setFilteredPosts(posts);
    }
  }, [posts, currentCategory, currentTab]);

  // 필터링된 게시물 정렬 (최신순)
  useEffect(() => {
    const sortedPosts = [...filteredPosts].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
    setFilteredPosts(sortedPosts);
  }, [filteredPosts]);

  const handleCategoryClick = (mainCategory: string) => {
    setSelectedCategory(mainCategory);
    setActiveTab('');
    setView('category');
    setCurrentPage(1);
    router.push(`/?category=${mainCategory}`);
  };

  const handleTabClick = (mainCategory: string, subCategory: string) => {
    router.push(`/?category=${mainCategory}&tab=${subCategory}`);
  };

  // 현재 선택된 카테고리에 맞는 지역 설정
  const currentRegion = extraBoards.includes(selectedCategory)
    ? selectedCategory
    : `${selectedCategory}-${activeTab}`;

  // 총 페이지 수 계산
  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);

  // 현재 페이지에 표시할 게시물
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* 카테고리 네비게이션 */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {mainCategories.map((mainCat) => (
              <button
                key={mainCat}
                onClick={() => handleCategoryClick(mainCat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${currentCategory === mainCat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {mainCat}
              </button>
            ))}
          </div>
        </div>

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

        {/* 게시글 목록 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="divide-y divide-gray-100">
            {filteredPosts.map((post) => {
              const [mainCat, subCat] = post.category.split('-');
              return (
                <div
                  key={post.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/read/${post.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{post.title}</h3>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span>{post.author}</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        <span className="text-blue-600">{mainCat} - {subCat}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>조회 {post.views}</span>
                      <span>댓글 {post.comment_count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
              className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 cursor-pointer font-medium shadow-sm transition-all duration-200 ease-in-out"
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
      </div>
    </div>
  );
} 