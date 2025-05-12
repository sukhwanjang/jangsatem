'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Props {
  region: string;
}

export default function WriteClient({ region }: Props) {
  const router = useRouter();

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
        region: region,
        user_id: user.id,
      }]);

    if (error) {
      alert('등록 실패: ' + error.message);
      setLoading(false);
      return;
    }

    alert(`등록 완료되었습니다. (${region})`);
    router.push('/');
  };

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">✍ 글쓰기 ({region})</h1>
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
