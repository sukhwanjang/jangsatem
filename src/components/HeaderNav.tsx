'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User } from '@supabase/supabase-js';
import { clearSession } from '@/lib/supabase';
import { categoryData } from '@/lib/categoryData';

interface HeaderNavProps {
  user: User | null;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  setActiveTab: (tab: string) => void;
  setView: (view: 'main' | 'category') => void;
  setCurrentPage: (page: number) => void;
  activeTab: string;
}

export default function HeaderNav({
  user,
  selectedCategory,
  setSelectedCategory,
  setActiveTab,
  setView,
  setCurrentPage,
  activeTab
}: HeaderNavProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = async () => {
    try {
      const { success, error } = await clearSession();
      if (!success) {
        console.error('로그아웃 중 오류 발생:', error);
        alert('로그아웃 중 오류가 발생했습니다. 페이지를 새로고침하세요.');
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      window.location.href = '/login';
    } catch (e) {
      console.error('로그아웃 실패:', e);
      alert('로그아웃 중 오류가 발생했습니다. 페이지를 새로고침하세요.');
      location.reload();
    }
  };

  const handleCategoryClick = (main: string) => {
    setSelectedCategory(main);
    setActiveTab('');
    setView('category');
    setCurrentPage(1);
    router.push(`/?category=${encodeURIComponent(main)}`);
  };

  const handleSubCategoryClick = (main: string, sub: string) => {
    setSelectedCategory(main);
    setActiveTab(sub);
    setView('category');
    setCurrentPage(1);
    router.push(`/?category=${encodeURIComponent(main)}&tab=${encodeURIComponent(sub)}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 검색 기능 추가 예정
    alert(`'${searchTerm}' 검색 기능은 개발 중입니다.`);
  };

  return (
    <div className="sticky top-0 z-50 w-full">
      {/* 상단 헤더 */}
      <div className="bg-blue-500 text-white">
        <div className="max-w-screen-xl mx-auto px-4 py-2 flex justify-between items-center">
          <div 
            className="text-2xl font-bold cursor-pointer"
            onClick={() => {
              setView('main');
              router.push('/');
            }}
          >
            장사템
          </div>
          
          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="검색어를 입력하세요"
                className="py-1 pl-3 pr-10 rounded-full text-gray-800 text-sm w-60 focus:outline-none"
              />
              <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>
            </form>
            
            {user ? (
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
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
            <button
              onClick={() => router.push('/register')}
              className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
            >
              회원가입
            </button>
          </div>
        </div>
      </div>
      
      {/* 메인 카테고리 내비게이션 바 */}
      <div className="bg-blue-50 border-b shadow-sm">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex overflow-x-auto whitespace-nowrap py-3 px-4 gap-6">
            {Object.keys(categoryData).map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-blue-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* 서브 카테고리 바 */}
      {selectedCategory && categoryData[selectedCategory] && (
        <div className="bg-white border-b">
          <div className="max-w-screen-xl mx-auto px-4 py-2">
            <div className="flex flex-wrap gap-2">
              {categoryData[selectedCategory].map((subCategory) => (
                <button
                  key={subCategory}
                  onClick={() => handleSubCategoryClick(selectedCategory, subCategory)}
                  className={`text-xs px-3 py-1.5 rounded-full border ${
                    activeTab === subCategory
                      ? 'bg-blue-100 text-blue-600 border-blue-300 font-medium'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {subCategory}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 