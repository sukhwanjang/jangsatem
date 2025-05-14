'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import WriteForm from '@/components/WriteForm';
import { User } from '@supabase/supabase-js';

interface Props {
  region: string;
}

export default function WriteClient({ region }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const extraBoards = ['자유게시판', '유머게시판', '내가게자랑'];

  useEffect(() => {
    const fetch = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);

      // region → "간판-명함" → category, tab 분리
      const parts = region.split('-');
      setSelectedCategory(parts[0]);
      setActiveTab(parts[1] || '');
    };
    fetch();
  }, [region]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">📝 글쓰기 ({region})</h1>
      <WriteForm
        user={user}
        activeTab={activeTab}
        selectedCategory={selectedCategory}
        extraBoards={extraBoards}
        setPosts={() => {}} // 필수 props지만 여기선 필요 없음
        setNewPostContent={() => {}} // 필요 없음
        setSelectedCategory={() => {}}
        setActiveTab={() => {}}
        setView={() => router.push(`/?category=${selectedCategory}&tab=${activeTab}`)}
        setIsWriting={() => {}}
      />
    </div>
  );
}
