'use client';
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface BusinessCard {
  id: number;
  name: string;
  region: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  region: string;
  user_id?: string;
}

export default function Home() {
  const categories = [
    "간판", "현수막", "배너", "메뉴판", "시트컷팅", "기타 출력물",
    "사다리차", "스카이", "포크레인", "철거", "전기설비", "용접"
  ];
  const fixedSubCategories = ["명함", "견적문의"];

  const router = useRouter();
  const [view, setView] = useState<'main' | 'category'>('main');
  const [selectedCategory, setSelectedCategory] = useState("간판");
  const [activeTab, setActiveTab] = useState("명함");
  const [openCategory, setOpenCategory] = useState<string | null>("간판");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  const [businessCards, setBusinessCards] = useState<BusinessCard[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isWriting, setIsWriting] = useState<{ [key: string]: boolean }>({ 명함: false, 견적문의: false });
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data: cards } = await supabase.from("business_cards").select("*");
      if (cards) setBusinessCards(cards);

      const { data: postsData } = await supabase.from("posts").select("*");
      if (postsData) setPosts(postsData);
    };
    fetchUserAndData();
  }, []);

  const fillEmptyCards = <T,>(items: T[], total: number): (T | null)[] => {
    const filled: (T | null)[] = [...items];
    while (filled.length < total) filled.push(null);
    return filled;
  };

  const paginatedCards = fillEmptyCards(
    businessCards.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    itemsPerPage
  );

  const paginatedPosts = fillEmptyCards(
    posts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    itemsPerPage
  );

  const totalPages = Math.ceil(
    (activeTab === "명함" ? businessCards.length : posts.length) / itemsPerPage
  );

  const handleSubmit = async () => {
    if (!user) return;
    if (!newPostTitle || !newPostContent) return;

    const { data, error } = await supabase
      .from("posts")
      .insert([{ title: newPostTitle, content: newPostContent, region: "지역명", user_id: user.id }]);

    if (!error && data) {
      setPosts([data[0], ...posts]);
      setIsWriting((prev) => ({ ...prev, [activeTab]: false }));
      setNewPostTitle("");
      setNewPostContent("");
    }
  };

  const isBusinessCard = (item: BusinessCard | Post): item is BusinessCard => {
    return "name" in item;
  };

  return (
    <main className="min-h-screen flex bg-white text-gray-800">
      <aside className="w-60 min-h-screen border-r p-6 bg-gray-50 overflow-y-auto">
        <div className="text-xl font-bold mb-4 text-blue-600 cursor-pointer" onClick={() => setView('main')}>
          장사템
        </div>
        <div className="space-y-2">
          {categories.map((item) => (
            <div key={item}>
              <button
                onClick={() => {
                  setOpenCategory(openCategory === item ? null : item);
                  setSelectedCategory(item);
                  setActiveTab("명함");
                  setView('category');
                  setCurrentPage(1);
                }}
                className={`w-full text-left bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === item ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                {item}
              </button>
              {openCategory === item && (
                <div className="pl-4 pt-1 space-y-1">
                  {fixedSubCategories.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => {
                        setActiveTab(sub);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-2 py-1 rounded text-xs font-medium ${
                        activeTab === sub ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      ▸ {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      <div className="flex-1 p-6">
        <header className="flex justify-end mb-4">
          {user ? (
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setUser(null);
              }}
              className="px-3 py-1 bg-gray-300 text-sm rounded hover:bg-gray-400"
            >
              로그아웃
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              로그인
            </button>
          )}
        </header>

        {view === 'main' ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-blue-600 mb-4">🎯 원하는 업체를 한눈에!</h1>
              <div className="w-full h-64 bg-gradient-to-r from-blue-200 to-blue-100 flex items-center justify-center rounded-xl shadow-inner">
                <p className="text-2xl font-semibold text-blue-800">여기에 대기업스러운 메인 이미지 또는 프로모션 삽입 가능</p>
              </div>
            </div>

            <section>
              <h2 className="text-lg font-semibold mb-4">💼 입점 대기 중인 홍보 업체</h2>
              <div className="grid grid-cols-3 gap-6">
                {fillEmptyCards(businessCards.slice(0, 6), 6).map((card, i) => (
                  <div key={i} className="border rounded-xl p-6 text-center shadow-md hover:shadow-lg transition min-h-[280px]">
                    {card ? (
                      <>
                        <div className="w-full h-48 bg-gray-100 rounded mb-4 flex items-center justify-center text-gray-400 text-sm">이미지 없음</div>
                        <p className="font-semibold text-base mb-1">{card.name}</p>
                        <p className="text-sm text-gray-500">{card.region}</p>
                      </>
                    ) : (
                      <div className="w-full h-48 bg-gray-100 rounded mb-4" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="text-center text-gray-400">카테고리 보기 기능 준비 중...</div>
        )}
      </div>
    </main>
  );
}
