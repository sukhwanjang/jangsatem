'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, clearSession } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import WriteForm from '@/components/WriteForm';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

// 분리한 컴포넌트들 임포트
import { ITEMS_PER_PAGE, BusinessCard, Post, categoryData, extraBoards } from '@/lib/categoryData';
import Banner from '@/components/Banner';
import MainPage from '@/components/MainPage';
import CategoryPage from '@/components/CategoryPage';
import HeaderNav from '@/components/HeaderNav';
import AdBanner from '@/components/AdBanner';

export default function HomeClient() {
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

  // 슬라이더에 사용할 이미지 경로 배열 (public/images/에 배치)
  const sliderImages = [
    '/images/banner1.png',
    '/images/banner2.png',
  ];

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
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* 헤더 및 네비게이션 */}
      <HeaderNav 
        user={user}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        setActiveTab={setActiveTab}
        setView={setView}
        setCurrentPage={setCurrentPage}
        activeTab={activeTab}
      />

      {/* Swiper 이미지 슬라이더 - 헤더 아래, 메인 컨텐츠 위 */}
      <div className="w-full max-w-4xl mx-auto mt-6">
        <Swiper
          spaceBetween={20}
          slidesPerView={1}
          loop={true}
          pagination={{ clickable: true }}
          className="rounded-xl overflow-hidden shadow-lg"
        >
          {sliderImages.map((src, idx) => (
            <SwiperSlide key={idx}>
              <Image src={src} alt={`배너${idx+1}`} width={1200} height={300} className="w-full h-64 object-cover" />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1">
        <div className="max-w-[1440px] mx-auto py-8 px-4">
          {/* 메인 콘텐츠 영역 - 광고/배너/우측영역 모두 제거, MainPage만 남김 */}
          <div className="bg-transparent p-0 shadow-none">
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
        </div>
      </div>

      {/* 푸터 */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">장사템</h3>
            <p className="text-gray-400 text-sm mb-4">소상공인 장비/간판/인력 정보 플랫폼</p>
            <div className="flex justify-center space-x-6 text-sm">
              <a href="/terms" className="hover:text-blue-400">이용약관</a>
              <a href="/privacy" className="hover:text-blue-400">개인정보처리방침</a>
              <a href="#" className="hover:text-blue-400">고객센터</a>
            </div>
            <p className="mt-4 text-xs text-gray-500">© 2024 장사템. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
