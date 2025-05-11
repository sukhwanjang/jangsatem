'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ✅ Next.js의 searchParams 타입과 완전히 호환되도록 수정
interface Props {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function WriteClient({ searchParams }: Props) {
  const router = useRouter();

  // ✅ category 값 추출 (string 또는 string[] 대응)
  const rawCategory = typeof searchParams?.category === 'string'
    ? searchParams.category
    : Array.isArray(searchParams?.category)
      ? searchParams.category[0]
      : undefined;

  const allowedCategories = ['자유게시판', '유머게시판', '내가게자랑'];
  const category = allowedCategories.includes(rawCategory || '')
    ? rawCategory!
    : '자유게시판';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인 후 작성 가능합니다.');
      setLoading(false);
      return;
    }

    if (title.trim().length < 2 || content.trim().length < 5) {
      alert('제목은 2자 이상, 내용은 5자 이상 입력해주세요.');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('posts')
      .insert([{
        title: title.trim(),
        content: content.trim(),
        region: category,
        user_id: user.id,
      }]);

    if (error) {
      alert('등록 실패: ' + error.message);
      setLoading(false);
      return;
    }

    alert('등록 완료되었습니다.');
    router.push('/');
  };

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">✍ 글쓰기 ({category})</h1>
      <input
        type="text"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border mb-2 p-2 rounded"
      />
      <textarea
        placeholder="내용"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full border mb-2 p-2 rounded h-40"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`bg-blue-600 text-white px-4 py-2 rounded ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? '등록 중...' : '등록'}
        </button>
        <button
          onClick={() => router.back()}
          className="bg-gray-300 text-black px-4 py-2 rounded"
        >
          취소
        </button>
      </div>
    </main>
  );
}
