'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface BusinessCard {
  id: number;
  name: string;
  region: string;
  image_url?: string;
  link_url?: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  region: string;
  user_id?: string;
}

export default function Home() {
  const categories = ['간판', '현수막', '배너', '기타 출력물', '스카이', '철거', '전기설비', '인테리어', '프렌차이즈'];
  const extraBoards = ['자유게시판', '유머게시판', '내가게자랑'];
  const fixedSubCategories = ['명함', '견적문의'];

  const router = useRouter();
  const [view, setView] = useState<'main' | 'category'>('main');
  const [selectedCategory, setSelectedCategory] = useState('간판');
  const [activeTab, setActiveTab] = useState('명함');
  const [openCategory, setOpenCategory] = useState<string | null>('간판');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  const [businessCards, setBusinessCards] = useState<BusinessCard[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isWriting, setIsWriting] = useState<{ [key: string]: boolean }>({});
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState<string | File>('');

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data: cards } = await supabase.from('business_cards').select('*');
      if (cards) setBusinessCards(cards);

      const { data: postsData } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (postsData) setPosts(postsData);
    };
    fetchUserAndData();
  }, []);

  const fillEmptyCards = <T,>(items: T[], total: number): (T | null)[] => {
    const filled: (T | null)[] = [...items];
    while (filled.length < total) filled.push(null);
    return filled;
  };

  const filteredPosts = posts.filter(post => post.region === (activeTab || selectedCategory));
  const paginatedPosts = fillEmptyCards(filteredPosts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), itemsPerPage);
  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);

  const handleSubmit = async () => {
    if (!user) {
      alert('로그인 후 작성 가능합니다.');
      return;
    }
    if (typeof newPostContent !== 'string' || newPostContent.trim().length < 5) {
      alert('내용은 5자 이상 입력해주세요.');
      return;
    }

    const { data, error } = await supabase.from('posts').insert([
      {
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        region: activeTab || selectedCategory,
        user_id: user.id,
      },
    ]).select();

    if (error) {
      alert('등록 실패: ' + error.message);
      return;
    }

    if (data) {
      const { data: refreshedPosts } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      setPosts(refreshedPosts || []);
      setIsWriting((prev) => ({ ...prev, [selectedCategory]: false }));
      setNewPostTitle('');
      setNewPostContent('');
    }
  };

  const isBusinessCard = (item: BusinessCard | Post): item is BusinessCard => {
    return 'name' in item;
  };

  return (
    <main className="min-h-screen flex bg-white text-gray-800">
      <aside className="w-60 min-h-screen border-r p-6 bg-gray-50 overflow-y-auto">
        <div className="text-xl font-bold mb-4 text-blue-600 cursor-pointer" onClick={() => setView('main')}>장사템</div>
        <div className="space-y-2">
          {categories.map((item) => (
            <div key={item}>
              <button
                onClick={() => {
                  setOpenCategory(openCategory === item ? null : item);
                  setSelectedCategory(item);
                  setActiveTab('명함');
                  setView('category');
                  setCurrentPage(1);
                }}
                className={`w-full text-left bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium transition ${selectedCategory === item ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}
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
                      className={`w-full text-left px-2 py-1 rounded text-xs font-medium ${activeTab === sub ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      ▸ {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-gray-200 mt-4 space-y-2">
          {extraBoards.map((board) => (
            <button
              key={board}
              onClick={() => {
                setSelectedCategory(board);
                setActiveTab('');
                setView('category');
                setCurrentPage(1);
              }}
              className={`w-full text-left bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium transition ${selectedCategory === board ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-green-50 hover:text-green-600'}`}
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
          <div> {/* 생략: 메인 뷰 내용 */} </div>
        ) : (
          <>
            <header className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-blue-600">{selectedCategory}</h1>
              {user && (
                <button
                  onClick={() => {
                    const query = new URLSearchParams();
                    if (selectedCategory) query.append('category', selectedCategory);
                    if (activeTab) query.append('tab', activeTab);
                    router.push(`/write?${query.toString()}`);
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  글쓰기
                </button>
              )}
            </header>
            <div> {/* 생략: 글 목록 뷰 */} </div>
          </>
        )}
      </div>
    </main>
  );
}
