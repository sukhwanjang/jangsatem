'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { BusinessCard, Post, ITEMS_PER_PAGE, extraBoards, fillEmptyCards, isBusinessCard, categoryData } from '@/lib/categoryData';
import { supabase } from '@/lib/supabase';
import WriteForm from './WriteForm';
import PostList from './PostList';

// 확장된 Post 타입 정의
interface ExtendedPost extends Post {
  like_count?: number;
  comment_count?: number;
  author_nickname?: string;
}

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
  const [sortByPopular, setSortByPopular] = useState(false);
  const [postsWithLikes, setPostsWithLikes] = useState<ExtendedPost[]>([]);
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);
  
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
  
  // 좋아요 수에 따른 게시물 정렬 처리
  useEffect(() => {
    // 인기글 정렬이 활성화된 경우에만 좋아요 정보를 가져오기
    if (sortByPopular) {
      const fetchLikesForPosts = async () => {
        try {
          setIsLoadingLikes(true);
          
          // 불필요한 API 호출 방지를 위해 이미 좋아요 정보가 있는지 확인
          if (postsWithLikes.length === 0 || postsWithLikes.length !== filteredPosts.length) {
            // 현재 필터링된 게시물에 대해서만 좋아요 수 가져오기
            const postsWithLikeCount = await Promise.all(
              filteredPosts.map(async (post) => {
                // 좋아요 정보 가져오기
                const { data: likes } = await supabase
                  .from('likes')
                  .select('id')
                  .eq('post_id', post.id);
                  
                // 댓글 정보 가져오기
                const { data: comments } = await supabase
                  .from('comments')
                  .select('id')
                  .eq('post_id', post.id);
                  
                // 사용자 정보 가져오기
                let authorNickname = '익명';
                
                if (post.user_id) {
                  try {
                    const { data: userData } = await supabase
                      .from('users')
                      .select('nickname')
                      .eq('user_id', post.user_id)
                      .single();
                      
                    if (userData?.nickname) {
                      authorNickname = userData.nickname;
                    }
                  } catch (error) {
                    console.error("사용자 정보 조회 중 오류:", error);
                  }
                }
                
                return {
                  ...post,
                  like_count: likes?.length || 0,
                  comment_count: comments?.length || 0,
                  author_nickname: authorNickname
                };
              })
            );
            
            setPostsWithLikes(postsWithLikeCount);
          }
        } catch (error) {
          console.error("좋아요 정보 가져오기 중 오류:", error);
        } finally {
          setIsLoadingLikes(false);
        }
      };
      
      fetchLikesForPosts();
    }
  }, [sortByPopular, filteredPosts, postsWithLikes.length]);
  
  // 정렬된 게시물 (인기순 또는 최신순)
  const sortedPosts = sortByPopular && postsWithLikes.length > 0
    ? [...postsWithLikes].sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
    : [...filteredPosts];
  
  // 총 페이지 수 계산
  const totalPages = Math.ceil(sortedPosts.length / ITEMS_PER_PAGE);

  // 현재 페이지에 표시할 게시물
  const paginatedPosts = sortedPosts.slice(
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

      {/* 인기글과 서브 카테고리 버튼만 상단에 배치 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            // 현재 카테고리 내에서 인기글로 정렬
            setSortByPopular(!sortByPopular);
            setCurrentPage(1); // 페이지를 첫 페이지로 리셋
          }}
          className={`px-4 py-1.5 text-sm rounded-full font-medium shadow-sm transition-all duration-200 ease-in-out border ${
            sortByPopular 
              ? "bg-gray-300 text-gray-900 border-gray-400" 
              : "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"
          }`}
        >
          인기글
        </button>
        
        {activeTab && (
          <button
            className="px-4 py-1.5 bg-gray-200 text-gray-800 text-sm rounded-full cursor-default font-medium shadow-sm border border-gray-300"
          >
            {activeTab}
          </button>
        )}
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
    </>
  );
} 