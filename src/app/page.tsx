'use client';
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
}

export default function Home() {
  const categories = [
    "간판", "현수막", "배너", "메뉴판", "시트컷팅", "기타 출력물",
    "사다리차", "스카이", "포크레인", "철거", "전기설비", "용접"
  ];
  const fixedSubCategories = ["명함", "견적문의"];

  const [view, setView] = useState<'main' | 'category'>('main');
  const [selectedCategory, setSelectedCategory] = useState("간판");
  const [activeTab, setActiveTab] = useState("명함");
  const [openCategory, setOpenCategory] = useState<string | null>("간판");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  const [businessCards, setBusinessCards] = useState<BusinessCard[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isWriting, setIsWriting] = useState<{ [key: string]: boolean }>({ 명함: false, 견적문의: false });
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data: cards, error: cardError } = await supabase.from("business_cards").select("*");
      if (!cardError && cards) setBusinessCards(cards);

      const { data: postsData, error: postError } = await supabase.from("posts").select("*");
      if (!postError && postsData) setPosts(postsData);
    };
    fetchData();
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
    if (!newPostTitle || !newPostContent) {
      alert("제목과 내용을 입력해주세요!");
      return;
    }
    const { data, error } = await supabase
      .from("posts")
      .insert([{ title: newPostTitle, content: newPostContent, region: "지역명" }]);
    if (!error && data) {
      setPosts([data[0], ...posts]);
      setIsWriting((prev) => ({ ...prev, [activeTab]: false }));
      setNewPostTitle("");
      setNewPostContent("");
    }
  };

  // BusinessCard인지 확인하는 타입 가드
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
              <div className="grid grid-cols-6 gap-4">
                {fillEmptyCards(businessCards.slice(0, 12), 12).map((card, i) => (
                  <div key={i} className="border rounded-xl p-4 text-center shadow-sm hover:shadow-md transition">
                    {card ? (
                      <>
                        <div className="w-full h-28 bg-gray-100 rounded mb-2 flex items-center justify-center text-gray-400 text-sm">이미지 없음</div>
                        <p className="font-semibold text-sm">{card.name}</p>
                        <p className="text-xs text-gray-500">{card.region}</p>
                      </>
                    ) : (
                      <div className="w-full h-28 bg-gray-100 rounded mb-2" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <header className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-blue-600">{selectedCategory}</h1>
              <button
                onClick={() => setIsWriting((prev) => ({ ...prev, [activeTab]: !prev[activeTab] }))}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                {isWriting[activeTab] ? "취소" : "글쓰기"}
              </button>
            </header>

            {isWriting[activeTab] && (
              <div className="bg-gray-50 p-4 mb-4 rounded border">
                <input
                  type="text"
                  placeholder="제목을 입력하세요"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="block w-full mb-2 border rounded p-2"
                />
                <textarea
                  placeholder="내용을 입력하세요"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="block w-full mb-2 border rounded p-2 h-24"
                />
                <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  제출
                </button>
              </div>
            )}

            <div className="grid grid-cols-6 gap-4">
              {(activeTab === "명함" ? paginatedCards : paginatedPosts).map((item, index) => {
                if (!item) {
                  return (
                    <div key={index} className="border rounded-xl p-3 text-center bg-white shadow-sm hover:shadow-md transition min-h-[150px]">
                      <div className="w-full h-36 flex items-center justify-center text-gray-200">빈칸</div>
                    </div>
                  );
                }

                return (
                  <div key={index} className="border rounded-xl p-3 text-center bg-white shadow-sm hover:shadow-md transition min-h-[150px]">
                    <div className="w-full h-28 bg-gray-100 mb-2 flex items-center justify-center text-xs text-gray-400">이미지 없음</div>
                    <p className="font-semibold text-sm mb-1">
                      {isBusinessCard(item) ? item.name : item.title}
                    </p>
                    <p className="text-xs text-gray-500">{item.region}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center mt-6 space-x-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 text-sm rounded border ${
                    currentPage === i + 1 ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
