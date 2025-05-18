'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { categoryData, extraBoards } from '@/lib/categoryData';

interface SidebarProps {
  openCategory: string | null;
  selectedCategory: string;
  setOpenCategory: (category: string | null) => void;
  setSelectedCategory: (category: string) => void;
  setActiveTab: (tab: string) => void;
  setView: (view: 'main' | 'category') => void;
  setCurrentPage: (page: number) => void;
  activeTab: string;
}

export default function Sidebar({
  openCategory,
  selectedCategory,
  setOpenCategory,
  setSelectedCategory,
  setActiveTab,
  setView,
  setCurrentPage,
  activeTab
}: SidebarProps) {
  const router = useRouter();

  const handleMainCategoryClick = (main: string) => {
    // 현재 열린 카테고리와 같으면 닫기
    if (openCategory === main) {
      setOpenCategory(null);
      return;
    }
    
    // 열린 카테고리 변경 및 해당 카테고리 페이지로 이동
    setOpenCategory(main);
    setSelectedCategory(main);
    setActiveTab(''); // 서브 카테고리는 초기화
    setView('category');
    setCurrentPage(1);
    
    // URL 업데이트 (메인 카테고리만 쿼리로 전달)
    router.push(`/?category=${encodeURIComponent(main)}`);
  };

  const handleSubCategoryClick = (main: string, sub: string) => {
    setSelectedCategory(main);
    setActiveTab(sub);
    setView('category');
    setCurrentPage(1);
    
    // URL 업데이트 (메인 및 서브 카테고리 쿼리 전달)
    router.push(`/?category=${encodeURIComponent(main)}&tab=${encodeURIComponent(sub)}`);
  };

  return (
    <aside className="w-60 min-h-screen border-r p-6 bg-gray-50 overflow-y-auto">
      <div 
        className="text-xl font-bold mb-4 text-blue-600 cursor-pointer" 
        onClick={() => {
          setView('main');
          router.push('/');
        }}
      >
        장사템
      </div>

      <div className="space-y-2">
        {Object.entries(categoryData).map(([main, subs]) => (
          <div key={main}>
            <button
              onClick={() => handleMainCategoryClick(main)}
              className={`w-full text-left ${selectedCategory === main && !activeTab ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'} border px-4 py-2 font-bold`}
            >
              {main}
            </button>
            {openCategory === main && (
              <div className="pl-4 pt-1 space-y-1">
                {subs.map((sub: string) => (
                  <button
                    key={sub}
                    onClick={() => handleSubCategoryClick(main, sub)}
                    className={`block w-full text-left text-sm px-2 py-1 rounded ${
                      selectedCategory === main && activeTab === sub ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
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

      <div className="pt-4 border-t border-gray-200 mt-4 space-y-2">
        {extraBoards.map((board) => (
          <button
            key={board}
            onClick={() => {
              setSelectedCategory(board);
              setActiveTab("");
              setView("category");
              setCurrentPage(1);
              
              // URL 업데이트
              router.push(`/?category=${encodeURIComponent(board)}`);
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
  );
} 