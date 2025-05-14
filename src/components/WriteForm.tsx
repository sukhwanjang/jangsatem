'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface Post {
  id: number;
  title: string;
  content: string;
  region: string;
  user_id?: string;
}

interface Props {
  user: User | null;
  activeTab: string;
  selectedCategory: string;
  extraBoards: string[];
  setPosts: (posts: Post[]) => void;
  setNewPostContent: (v: string | File) => void;
  setSelectedCategory: (v: string) => void;
  setActiveTab: (v: string) => void;
  setView: (v: 'main' | 'category') => void;
  setIsWriting: (v: (prev: { [key: string]: boolean }) => { [key: string]: boolean }) => void;
}

export default function WriteForm({
  user,
  activeTab,
  selectedCategory,
  extraBoards,
  setPosts,
  setNewPostContent,
  setSelectedCategory,
  setActiveTab,
  setView,
  setIsWriting,
}: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (file) {
      setNewPostContent(file);
    } else {
      setNewPostContent('');
    }
  }, [file, setNewPostContent]);

  const handleSubmit = async () => {
    if (!user) {
      alert('로그인 후 작성해주세요.');
      return;
    }

    setLoading(true);

    const region = extraBoards.includes(selectedCategory)
      ? selectedCategory
      : `${selectedCategory}-${activeTab}`;

    if (activeTab === '명함') {
      if (!file) {
        alert('이미지를 선택해주세요.');
        setLoading(false);
        return;
      }

      const filePath = `${user.id}_${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('businesscard').upload(filePath, file);
      if (uploadError) {
        alert('이미지 업로드 실패: ' + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: publicUrl } = supabase.storage.from('businesscard').getPublicUrl(filePath);
      const { error: insertError } = await supabase.from('posts').insert([
        {
          title: '명함 이미지',
          content: publicUrl.publicUrl,
          region,
          user_id: user.id,
        },
      ]);
      if (insertError) {
        alert('등록 실패: ' + insertError.message);
        setLoading(false);
        return;
      }
    } else {
      if (title.trim().length < 2 || content.trim().length < 5) {
        alert('제목은 2자 이상, 내용은 5자 이상 입력해주세요.');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from('posts').insert([
        {
          title: title.trim(),
          content: content.trim(),
          region,
          user_id: user.id,
        },
      ]);
      if (insertError) {
        alert('등록 실패: ' + insertError.message);
        setLoading(false);
        return;
      }
    }

    const { data: refreshedPosts } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    setPosts(refreshedPosts || []);
    setNewPostContent('');
    setTitle('');
    setContent('');
    setFile(null);
    setLoading(false);

    const [category, tab] = region.split('-');
    setSelectedCategory(category);
    setActiveTab(tab || '');
    setView('category');
    setIsWriting((prev) => ({ ...prev, [region]: false }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto mt-10">
      <h2 className="text-xl font-bold mb-6 text-blue-700">✍ 글쓰기</h2>

      {activeTab !== '명함' && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={6}
              className="w-full px-4 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {activeTab === '명함' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">명함 이미지 업로드</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
        </div>
      )}

      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={() => setIsWriting((prev) => {
            const region = extraBoards.includes(selectedCategory)
              ? selectedCategory
              : `${selectedCategory}-${activeTab}`;
            return { ...prev, [region]: false };
          })}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? '등록 중...' : '등록하기'}
        </button>
      </div>
    </div>
  );
}
