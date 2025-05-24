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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 검색 기능 추가 예정
    alert(`'${searchTerm}' 검색 기능은 개발 중입니다.`);
  };

  return (
    <div className="sticky top-0 z-50 w-full">
      {/* 상단 헤더 및 메가 드롭다운 래퍼 */}
      <div
        className="bg-blue-500 text-white relative"
        onMouseEnter={() => setMegaMenuOpen(true)}
        onMouseLeave={() => setMegaMenuOpen(false)}
      >
        <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center w-full">
          {/* 로고 */}
          <div 
            className="text-xl font-bold cursor-pointer mr-4"
            onClick={() => {
              setView('main');
              router.push('/');
            }}
          >
            장사템
          </div>
          {/* 메인 카테고리 메뉴 (hover만, 클릭 이벤트 제거) */}
          <div className="hidden md:flex space-x-6">
            {categoryData.map((group) => (
              <div
                key={group.group}
                className="px-2 py-1 font-bold cursor-pointer text-sm whitespace-nowrap"
              >
                {group.group}
              </div>
            ))}
          </div>
          {/* 검색 및 로그인/회원가입 버튼 등 기존 코드 유지 */}
          <div className="hidden md:flex items-center space-x-4 ml-auto">
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
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 cursor-pointer"
              >
                로그아웃
              </button>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 cursor-pointer"
              >
                로그인
              </button>
            )}
            {user && (
              <button
                onClick={() => router.push('/mypage')}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 cursor-pointer"
              >
                마이페이지
              </button>
            )}
            {!user && (
              <button
                onClick={() => router.push('/register')}
                className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 cursor-pointer"
              >
                회원가입
              </button>
            )}
          </div>
          {/* 모바일 메뉴 버튼 (기존 유지) */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white p-2"
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {/* 메가 드롭다운 (데스크톱에서만) */}
        {megaMenuOpen && (
          <div className="absolute left-0 w-full bg-white shadow-lg z-50 border-t">
            <div className="max-w-screen-xl mx-auto grid grid-cols-4 gap-6 py-4">
              {categoryData.map((group) => (
                <div key={group.group}>
                  <div className="font-bold text-gray-900 mb-1 text-sm whitespace-nowrap">{group.group}</div>
                  <ul>
                    {group.categories.map((sub) => (
                      <li
                        key={sub}
                        className="py-1 px-2 hover:bg-blue-50 rounded cursor-pointer text-xs text-gray-800 whitespace-nowrap"
                        onClick={() => {
                          setSelectedCategory(group.group);
                          setActiveTab(sub);
                          setView('category');
                          setCurrentPage(1);
                          router.push(`/?category=${encodeURIComponent(group.group)}&tab=${encodeURIComponent(sub)}`);
                          setMegaMenuOpen(false);
                        }}
                      >
                        {sub}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 모바일 메뉴 드롭다운 */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-blue-600 text-white">
          <div className="px-4 py-3 space-y-3">
            {/* 카테고리 모바일 메뉴 */}
            <div className="grid grid-cols-2 gap-2">
              {categoryData.map((group) => (
                <button
                  key={group.group}
                  onClick={() => setSelectedCategory(group.group)}
                  className={`text-sm text-left px-3 py-2 rounded cursor-pointer ${
                    selectedCategory === group.group
                      ? 'bg-blue-500 text-white'
                      : 'text-white hover:bg-blue-500'
                  }`}
                >
                  {group.group}
                </button>
              ))}
            </div>
            
            {/* 모바일 검색 */}
            <form onSubmit={handleSearch} className="relative mt-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="검색어를 입력하세요"
                className="w-full py-2 pl-3 pr-10 rounded text-gray-800 text-sm focus:outline-none"
              />
              <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>
            </form>
            
            {/* 모바일 인증 버튼 */}
            <div className="flex flex-wrap gap-2 mt-3">
              {user ? (
                <>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 flex-grow cursor-pointer"
                  >
                    로그아웃
                  </button>
                  <button
                    onClick={() => {
                      router.push('/mypage');
                      setMobileMenuOpen(false);
                    }}
                    className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 flex-grow cursor-pointer"
                  >
                    마이페이지
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      router.push('/login');
                      setMobileMenuOpen(false);
                    }}
                    className="px-3 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 flex-grow cursor-pointer"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => {
                      router.push('/register');
                      setMobileMenuOpen(false);
                    }}
                    className="px-3 py-2 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 flex-grow cursor-pointer"
                  >
                    회원가입
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 모바일에서만: 서브카테고리 바 */}
      {/* 데스크톱은 각 버튼 아래 드롭다운으로 노출되므로, 모바일에서만 전체 바 형태로 노출 */}
      <div className="md:hidden">
        {selectedCategory && (
          <div className="flex justify-center gap-1 py-1 bg-white border-b">
            {categoryData.find(g => g.group === selectedCategory)?.categories.map((subCategory) => (
              <button
                key={subCategory}
                onClick={() => setSelectedCategory(selectedCategory)}
                className={`text-xs px-2 py-1 rounded-full border whitespace-nowrap cursor-pointer ${
                  activeTab === subCategory
                    ? 'bg-blue-100 text-blue-600 border-blue-300 font-medium'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {subCategory}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 