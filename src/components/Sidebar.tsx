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

      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-sm mb-2">갤러리</h3>
          <div className="space-y-2">
            {categoryData.map((group) => (
              <div key={group.group}>
                <button
                  onClick={() => handleMainCategoryClick(group.group)}
                  className={`w-full text-left ${selectedCategory === group.group && !activeTab ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'} px-3 py-1.5 text-sm rounded`}
                >
                  {group.group}
                </button>
                {openCategory === group.group && (
                  <div className="pl-4 pt-1 space-y-1 flex flex-col items-center">
                    {group.items.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => handleSubCategoryClick(group.group, item.label)}
                        className={`block px-4 py-1 text-xs rounded mx-auto ${
                          selectedCategory === group.group && activeTab === item.label ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                        }`}
                      >
                        ▸ {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="font-medium text-sm mb-2">자유게시판 베스트</h3>
          <div className="space-y-2">
            {['자유게시판', '유머게시판', '내가게자랑'].map((board) => (
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
                className={`w-full text-left rounded px-3 py-1.5 text-sm ${
                  selectedCategory === board ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
                }`}
              >
                {board}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
} 