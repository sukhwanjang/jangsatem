'use client';
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";  // 경로 수정된 부분

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
    "간판",
    "현수막", 
    "배너",
    "메뉴판",
    "시트컷팅",
    "기타 출력물",
    "사다리차",
    "스카이",
    "포크레인",
    "철거",
    "전기설비",
    "용접"
  ];

  const fixedSubCategories = ["명함", "견적문의"];

  const [view, setView] = useState<'main' | 'category'>('main');
  const [selectedCategory, setSelectedCategory] = useState("간판");
  const [activeTab, setActiveTab] = useState("명함");
  const [openCategory, setOpenCategory] = useState<string | null>("간판");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  const [businessCards, setBusinessCards] = useState<BusinessCard[]>([]); // Supabase에서 명함 데이터를 저장할 상태
  const [posts, setPosts] = useState<Post[]>([]); // 견적문의 데이터 추가

  const [isWriting, setIsWriting] = useState<{ [key: string]: boolean }>({
    명함: false,
    견적문의: false,
  });
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      // 명함 데이터 가져오기
      const { data: cards, error: cardError } = await supabase
        .from("business_cards") // 실제 Supabase 테이블 이름
        .select("*");

      if (cardError) {
        console.error("명함 불러오기 실패:", cardError.message);
      } else {
        setBusinessCards(cards || []);
      }

      // 견적문의 데이터 가져오기
      const { data: postsData, error: postError } = await supabase
        .from("posts") // 실제 Supabase 테이블 이름
        .select("*");

      if (postError) {
        console.error("견적문의 불러오기 실패:", postError.message);
      } else {
        setPosts(postsData || []);
      }
    };

    fetchData();
  }, []); // 컴포넌트 처음 로드될 때만 실행

  // 명함 데이터 페이지네이션 처리
  const paginatedCards = businessCards.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  // 견적문의 데이터 페이지네이션 처리
  const paginatedPosts = posts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil(businessCards.length / itemsPerPage);

  const handleSubmit = async () => {
    if (!newPostTitle || !newPostContent) {
      alert("제목과 내용을 입력해주세요!");
      return;
    }

    // Supabase에 글을 추가
    const { data, error } = await supabase
      .from("posts")
      .insert([{ title: newPostTitle, content: newPostContent, region: "지역명" }]);

    if (error) {
      console.error("글 추가 실패:", error.message);
    } else {
      // data가 null인 경우를 안전하게 처리
      if (data) {
        setPosts([data[0], ...posts]); // 새 글을 앞에 추가
        setIsWriting((prev) => ({ ...prev, [activeTab]: false })); // 글쓰기 종료
        setNewPostTitle(""); // 입력 폼 초기화
        setNewPostContent("");
      }
    }
  };

  return (
    <main className="min-h-screen flex bg-white text-gray-800">
      {/* 왼쪽 카테고리 고정 */}
      <aside className="w-60 min-h-screen border-r p-6 bg-gray-50 overflow-y-auto">
        <div className="text-xl font-bold mb-4 text-blue-600 cursor-pointer" onClick={() => setView('main')}>장사템</div>
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

      {/* 오른쪽 메인화면 또는 카테고리화면 */}
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
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {businessCards.slice(0, 12).map((card) => (
                  <div key={card.id} className="border rounded-xl p-4 text-center shadow-sm hover:shadow-md transition">
                    <div className="w-full h-28 bg-gray-100 rounded mb-2 flex items-center justify-center text-gray-400 text-sm">이미지 없음</div>
                    <p className="font-semibold text-sm">{card.name}</p>
                    <p className="text-xs text-gray-500">{card.region}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <header className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-blue-600">{selectedCategory}</h1>
            </header>

            {/* 글쓰기 버튼 */}
            <button onClick={() => setIsWriting((prev) => ({ ...prev, [activeTab]: !prev[activeTab] }))}>
              {isWriting[activeTab] ? "취소" : "글쓰기"}
            </button>

            {isWriting[activeTab] && (
              <div className="writing-form">
                <input
                  type="text"
                  placeholder="제목을 입력하세요"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="input"
                />
                <textarea
                  placeholder="내용을 입력하세요"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="textarea"
                />
                <button onClick={handleSubmit} className="submit-btn">
                  제출
                </button>
              </div>
            )}

            {activeTab === "명함" && (
              <div className="grid grid-cols-6 gap-4">
                {paginatedCards.map((card) => (
                  <div key={card.id} className="border rounded-xl p-3 text-center bg-white shadow-sm hover:shadow-md transition">
                    <div className="w-full h-28 bg-gray-100 mb-2 flex items-center justify-center text-xs text-gray-400">이미지 없음</div>
                    <p className="font-semibold text-sm mb-1">{card.name}</p>
                    <p className="text-xs text-gray-500">{card.region}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "견적문의" && (
              <div className="grid grid-cols-6 gap-4">
                {paginatedPosts.map((post) => (
                  <div key={post.id} className="border rounded-xl p-3 bg-white shadow-sm hover:shadow-md transition">
                    <div className="w-full h-28 bg-gray-100 mb-2 flex items-center justify-center text-xs text-gray-400">이미지 없음</div>
                    <h2 className="font-semibold text-sm mb-1 text-gray-800">{post.title}</h2>
                    <p className="text-xs text-gray-500 line-clamp-3">{post.content}</p>
                    <div className="text-xs text-gray-400 mt-1">{post.region}</div>
                  </div>
                ))}
              </div>
            )}

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
