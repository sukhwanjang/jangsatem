'use client';
import Image from 'next/image'; // ✅ next/image import는 최상단 필수
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from "src/lib/supabase";
import { User } from "@supabase/supabase-js";

interface BusinessCard {
  id: number;
  name: string;
  region: string;
  image_url?: string;   // ✅ 이미지 URL
  link_url?: string;    // ✅ 클릭 시 이동할 외부 URL
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
  "간판", "현수막", "배너", "기타 출력물",
  "스카이", "철거", "전기설비",
  "인테리어", "프렌차이즈"
];

const extraBoards = ["자유게시판", "유머게시판", "내가게자랑"];

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
  const [isWriting, setIsWriting] = useState<{ [key: string]: boolean }>({});
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState<string | File>("");

  useEffect(() => {
  const fetchUserAndData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    console.log("✅ 현재 로그인 유저:", user);
    setUser(user);

    const { data: cards } = await supabase.from("business_cards").select("*");
    if (cards) setBusinessCards(cards);

    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false }); // ✅ 최신순 정렬
    if (postsData) setPosts(postsData);
  };
  fetchUserAndData();
}, []);
  const fillEmptyCards = <T,>(items: T[], total: number): (T | null)[] => {
    const filled: (T | null)[] = [...items];
    while (filled.length < total) filled.push(null);
    return filled;
  };

  const filteredPosts = posts.filter(
  (post) => post.region === (activeTab || selectedCategory)
);
const paginatedPosts = fillEmptyCards(
  filteredPosts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
  itemsPerPage
);

  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);


 const handleSubmit = async () => {
  if (!user) {
    alert("로그인 후 작성 가능합니다.");
    return;
  }

  if (typeof newPostContent !== "string" || newPostContent.trim().length < 5) {
  alert("내용은 5자 이상 입력해주세요.");
  return;
}

  console.log("🔐 user.id =", user?.id);

  const { data, error } = await supabase
    .from("posts")
    .insert([
      {
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        region: activeTab || selectedCategory,
        user_id: user.id,
      },
    ])
    .select();

  console.log("📦 Insert 결과:", { data, error });

  if (error) {
    alert("등록 실패: " + error.message);
    return;
  }

  if (data) {
    const { data: refreshedPosts } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false }); // ✅ 최신순 정렬 추가
    setPosts(refreshedPosts || []);
    setIsWriting((prev) => ({ ...prev, [selectedCategory]: false }));
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
                  setView('category');
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

  {/* 자유게시판 3개 추가 */}
  <div className="pt-4 border-t border-gray-200 mt-4 space-y-2">
    {extraBoards.map((board) => (
      <button
        key={board}
        onClick={() => {
          setSelectedCategory(board);
          setActiveTab("");
          setView("category");
          setCurrentPage(1);
        }}
        className={`w-full text-left bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium transition ${
          selectedCategory === board ? "bg-green-100 text-green-700" : "text-gray-700 hover:bg-green-50 hover:text-green-600"
        }`}
      >
        {board}
      </button>
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
...

<section>
  <h2 className="text-base font-semibold mb-3">💼 입점 대기 중인 홍보 업체</h2>
  <div className="flex flex-wrap gap-2 justify-start">
    {fillEmptyCards(businessCards.slice(0, 63), 63).map((card, i) => (
      <a
        key={i}
        href={card?.link_url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="w-[100px] h-[100px] border rounded-sm p-1 text-center shadow-sm hover:shadow-md transition bg-white block"
      >
        {card ? (
          <>
            {card.image_url && typeof card.image_url === 'string' ? (
              <Image
                src={card.image_url}
                alt={card.name}
                width={100}
                height={55}
                className="w-full h-[55%] object-cover rounded mb-0.5"
              />
            ) : (
              <div className="w-full h-[55%] bg-gray-100 rounded mb-0.5 flex items-center justify-center text-gray-300 text-[9px]">
                이미지 없음
              </div>
            )}
            <p className="font-medium text-[10px] truncate">{card.name}</p>
            <p className="text-[9px] text-gray-500">{card.region}</p>
          </>
        ) : (
          <div className="w-full h-full bg-gray-100 rounded" />
        )}
      </a>
    ))}
  </div>
</section>
<section className="mt-12">
  <h2 className="text-xl font-bold mb-4 text-gray-800">🔥 커뮤니티 최신글</h2>
  <div className="grid grid-cols-3 gap-6">
    {/* 자유게시판 */}
    <div className="bg-white border rounded-lg p-4 shadow">
      <h3 className="text-lg font-semibold mb-2 text-blue-600">자유게시판</h3>
      <ul className="space-y-2">
        {posts.filter(p => p.region === "자유게시판").slice(0, 3).map((post) => (
          <li key={post.id} className="text-sm text-gray-700 hover:underline cursor-pointer">
            {post.title}
          </li>
        ))}
      </ul>
    </div>

    {/* 유머게시판 */}
    <div className="bg-white border rounded-lg p-4 shadow">
      <h3 className="text-lg font-semibold mb-2 text-pink-600">유머게시판</h3>
      <ul className="space-y-2">
        {posts.filter(p => p.region === "유머게시판").slice(0, 3).map((post) => (
          <li key={post.id} className="text-sm text-gray-700 hover:underline cursor-pointer">
            {post.title}
          </li>
        ))}
      </ul>
    </div>

    {/* 내가게자랑 */}
    <div className="bg-white border rounded-lg p-4 shadow">
      <h3 className="text-lg font-semibold mb-2 text-green-600">내가게자랑</h3>
      <ul className="space-y-2">
        {posts.filter(p => p.region === "내가게자랑").slice(0, 3).map((post) => (
          <li key={post.id} className="text-sm text-gray-700 hover:underline cursor-pointer">
            {post.title}
          </li>
        ))}
      </ul>
    </div>
  </div>
</section>


          </>
        ) : (
          <>
            <header className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-blue-600">{selectedCategory}</h1>
              {user && (
  <button
onClick={() => router.push(`/write?category=${selectedCategory}&tab=${activeTab}`)}
    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
  >
    글쓰기
  </button>
)}
            </header>

           {isWriting[selectedCategory] && (
  <div className="bg-gray-50 p-4 mb-4 rounded border">
    {activeTab === "명함" ? (
      <>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
  const file = e.target.files?.[0];
  if (file) {
    setNewPostContent(file as File); // ← as File 붙여야 오류 안 납니다
  }
}}
          className="mb-2"
        />
        <button
          onClick={async () => {
            if (!user) {
              alert("로그인 후 작성 가능합니다.");
              return;
            }
            if (!newPostContent) {
              alert("이미지를 선택해주세요.");
              return;
            }

            const file = newPostContent as File;
            const filePath = `${user.id}_${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
              .from("businesscard")
              .upload(filePath, file);

            if (uploadError) {
              alert("이미지 업로드 실패: " + uploadError.message);
              return;
            }

            const { data: publicUrl } = supabase.storage
              .from("businesscard")
              .getPublicUrl(filePath);

            const { error: insertError } = await supabase
              .from("posts")
              .insert([
                {
                  title: "명함 이미지",
                  content: publicUrl.publicUrl,
                  region: activeTab,
                  user_id: user.id,
                },
              ]);

            if (insertError) {
              alert("등록 실패: " + insertError.message);
              return;
            }

            const { data: refreshedPosts } = await supabase
              .from("posts")
              .select("*")
              .order("created_at", { ascending: false });
            setPosts(refreshedPosts || []);
            setIsWriting((prev) => ({ ...prev, [selectedCategory]: false }));
            setNewPostContent("");
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          이미지 등록
        </button>
      </>
    ) : (
      <>
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={newPostTitle}
          onChange={(e) => setNewPostTitle(e.target.value)}
          className="block w-full mb-2 border rounded p-2"
        />
        <textarea
  placeholder="내용을 입력하세요"
  value={typeof newPostContent === "string" ? newPostContent : ""}
  onChange={(e) => setNewPostContent(e.target.value)}
  className="block w-full mb-2 border rounded p-2 h-24"
/>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" //
        >
          제출
        </button>
      </>
    )}
  </div>
)}


          <div className="grid grid-cols-6 gap-4">
  {paginatedPosts.map((item, index) => {
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
