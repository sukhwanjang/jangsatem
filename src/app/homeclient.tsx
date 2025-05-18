'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, clearSession } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import WriteForm from '@/components/WriteForm';

// 분리한 컴포넌트들 임포트
import { ITEMS_PER_PAGE, BusinessCard, Post } from '@/lib/categoryData';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Banner from '@/components/Banner';
import MainPage from '@/components/MainPage';
import CategoryPage from '@/components/CategoryPage';

export default function HomeClient() {
  const categoryData: { [main: string]: string[] } = {
    업체추천: ["간판", "스카이", "인테리어", "전기설비", "철거", "프렌차이즈"],
    장사시작템: ["간판", "현수막", "배너", "기타출력물", "스카이", "인테리어", "전기설비", "철거", "프렌차이즈"],
    창업아이템: ["무인아이템", "유인아이템", "프렌차이즈", "신박아이템"],
    추천글: ["자유게시판 베스트", "유머게시판 베스트", "이런장사어때요 베스트"],
    커뮤니티: ["핫한게시물", "자유게시판", "유머게시판", "이런장사어때요?"],
    업종별토론: ["반려동물", "무인창업", "제조업", "음식", "쇼핑몰", "배달", "스마트스토어", "미용", "숙박업", "스크린", "헬스장", "편의점", "학원"],
    공지: ["공지사항"]
  };
  const extraBoards = ["자유게시판", "유머게시판", "내가게자랑"];
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<'main' | 'category'>('main');
  const [selectedCategory, setSelectedCategory] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  const [businessCards, setBusinessCards] = useState<BusinessCard[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isWriting, setIsWriting] = useState<{ [key: string]: boolean }>({});
  const [newPostContent, setNewPostContent] = useState<string | File>("");

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data: cards } = await supabase.from("business_cards").select("*");
      if (cards) setBusinessCards(cards);

      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (postsData) setPosts(postsData);
    };
    fetchUserAndData();
  }, []);

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    const tabFromUrl = searchParams.get('tab');

    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
      setOpenCategory(categoryFromUrl);
      setView('category');

      if (tabFromUrl) {
        setActiveTab(tabFromUrl);
      } else {
        setActiveTab('');
      }
    }
  }, [searchParams]);

  const currentRegion = extraBoards.includes(selectedCategory)
    ? selectedCategory
    : `${selectedCategory}-${activeTab}`;

  const fillEmptyCards = <T extends object>(items: T[], total: number): (T | null)[] => {
    const filled: (T | null)[] = [...items];
    while (filled.length < total) filled.push(null);
    return filled;
  };

  const filteredPosts = posts.filter((post) => post.region === currentRegion);
  const paginatedPosts = fillEmptyCards(
    filteredPosts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    itemsPerPage
  );
  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);

  const isBusinessCard = (item: BusinessCard | Post): item is BusinessCard => {
    return "name" in item;
  };

  return (
    <main className="min-h-screen flex bg-white text-gray-800">
      {/* 사이드바 */}
      <Sidebar
        openCategory={openCategory}
        selectedCategory={selectedCategory}
        setOpenCategory={setOpenCategory}
        setSelectedCategory={setSelectedCategory}
        setActiveTab={setActiveTab}
        setView={setView}
        setCurrentPage={setCurrentPage}
        activeTab={activeTab}
      />

      <div className="flex-1 p-6">
        {/* 헤더 */}
        <Header user={user} />

        {/* 배너 */}
        <Banner />

        {/* 메인 또는 카테고리 페이지 */}
        {view === 'main' ? (
          <MainPage
            businessCards={businessCards}
            posts={posts}
          />
        ) : (
          <CategoryPage
            selectedCategory={selectedCategory}
            activeTab={activeTab}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            businessCards={businessCards}
            posts={posts}
            user={user}
            isWriting={isWriting}
            setIsWriting={setIsWriting}
            setNewPostContent={setNewPostContent}
            setPosts={setPosts}
            setSelectedCategory={setSelectedCategory}
            setActiveTab={setActiveTab}
            setView={setView}
          />
        )}
      </div>
    </main>
  );
}
