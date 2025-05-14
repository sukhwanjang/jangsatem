'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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

  useEffect(() => {
    if (file) {
      setNewPostContent(file);
    } else {
      setNewPostContent('');
    }
  }, [file, setNewPostContent]);

  const handleSubmit = async () => {
    if (!user) {
      alert('로그인 후 작성 가능합니다.');
      return;
    }

    if (activeTab === '명함') {
      if (!file) {
        alert('이미지를 선택해주세요.');
        return;
      }

      const filePath = `${user.id}_${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('businesscard')
        .upload(filePath, file);

      if (uploadError) {
        alert('이미지 업로드 실패: ' + uploadError.message);
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from('businesscard')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('posts').insert([{
        title: '명함 이미지',
        content: publicUrl.publicUrl,
        region: activeTab,
        user_id: user.id,
      }]);

      if (insertError) {
        alert('등록 실패: ' + insertError.message);
        return;
      }
    } else {
      if (content.trim().length < 5) {
        alert('내용은 5자 이상 입력해주세요.');
        return;
      }

      const { error: insertError } = await supabase.from('posts').insert([{
        title,
        content,
        region: `${selectedCategory}-${activeTab}`,
        user_id: user.id,
      }]);

      if (insertError) {
        alert('등록 실패: ' + insertError.message);
        return;
      }
    }

    const { data: refreshedPosts } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    setPosts(refreshedPosts || []);
    setNewPostContent('');

    const region = extraBoards.includes(selectedCategory)
      ? selectedCategory
      : `${selectedCategory}-${activeTab}`;

    setSelectedCategory(region.split('-')[0]);
    if (region.includes('-')) {
      setActiveTab(region.split('-')[1]);
    } else {
      setActiveTab('');
    }

    setView('category');
    setIsWriting((prev) => ({ ...prev, [region]: false }));
  };

  return (
    <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl shadow p-6 mt-8 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">글쓰기</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
        <textarea
          placeholder="내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {activeTab === '명함' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">명함 이미지 업로드</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
        >
          등록하기
        </button>
        <button
          onClick={() => setView('category')}
          className="bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400 text-sm"
        >
          취소
        </button>
      </div>
    </div>
  );
}
