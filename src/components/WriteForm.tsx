'use client';
import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';


interface Props {
  user: User | null;
  activeTab: string;
  selectedCategory: string;
  extraBoards: string[];
  setPosts: (posts: any[]) => void;
  setNewPostContent: (file: File | string) => void;
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

      const { error: insertError } = await supabase.from('posts').insert([
        {
          title: '명함 이미지',
          content: publicUrl.publicUrl,
          region: activeTab,
          user_id: user.id,
        },
      ]);

      if (insertError) {
        alert('등록 실패: ' + insertError.message);
        return;
      }
    } else {
      if (content.trim().length < 5) {
        alert('내용은 5자 이상 입력해주세요.');
        return;
      }

      const { error: insertError } = await supabase.from('posts').insert([
        {
          title,
          content,
          region: `${selectedCategory}-${activeTab}`,
          user_id: user.id,
        },
      ]);

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
    <div className="p-6 bg-white rounded-lg shadow-md space-y-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800">✍️ 글쓰기</h2>
      <input
        type="text"
        placeholder="제목을 입력하세요"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-gray-300 rounded p-2 text-sm"
      />
      <textarea
        placeholder="내용을 입력하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        className="w-full border border-gray-300 rounded p-2 text-sm"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="w-full text-sm"
      />
      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700"
      >
        등록하기
      </button>
    </div>
  );
}
