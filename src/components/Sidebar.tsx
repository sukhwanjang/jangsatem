'use client';

import { useState } from 'react';
import { categoryData, extraBoards } from '@/lib/categoryData';

interface SidebarProps {
  openCategory: string | null;
  selectedCategory: string;
  setOpenCategory: (category: string | null) => void;
  setSelectedCategory: (category: string) => void;
  setActiveTab: (tab: string) => void;
  setView: (view: 'main' | 'category') => void;
  setCurrentPage: (page: number) => void;
}

export default function Sidebar({
  openCategory,
  selectedCategory,
  setOpenCategory,
  setSelectedCategory,
  setActiveTab,
  setView,
  setCurrentPage
}: SidebarProps) {
  return (
    <aside className="w-60 min-h-screen border-r p-6 bg-gray-50 overflow-y-auto">
      <div 
        className="text-xl font-bold mb-4 text-blue-600 cursor-pointer" 
        onClick={() => setView('main')}
      >
        장사템
      </div>

      <div className="space-y-2">
        {Object.entries(categoryData).map(([main, subs]) => (
          <div key={main}>
            <button
              onClick={() => setOpenCategory(openCategory === main ? null : main)}
              className="w-full text-left bg-gray-100 border px-4 py-2 font-bold"
            >
              {main}
            </button>
            {openCategory === main && (
              <div className="pl-4 pt-1 space-y-1">
                {subs.map((sub: string) => (
                  <button
                    key={sub}
                    onClick={() => {
                      setSelectedCategory(main);
                      setActiveTab(sub);
                      setView('category');
                      setCurrentPage(1);
                    }}
                    className="block w-full text-left text-sm px-2 py-1 rounded hover:bg-gray-100"
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