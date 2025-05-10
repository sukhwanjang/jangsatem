'use client';
import { useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from "src/lib/supabase";

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ 반드시 함수 안에서 사용
  const category = searchParams.get('category') || '자유게시판';
  const tab = searchParams.get('tab') || '';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("로그인 후 작성 가능합니다.");
      return;
    }

    if (title.trim().length < 2 || content.trim().length < 5) {
      alert("제목은 2자 이상, 내용은 5자 이상 입력해주세요.");
      return;
    }

    const { error } = await supabase
      .from('posts')
      .insert([{ title, content, region: category, user_id: user.id }]); // ✅ category 반영

    if (error) {
      alert("등록 실패: " + error.message);
      return;
    }

    router.push('/'); // 완료 후 홈으로 이동
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
        <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">등록</button>
        <button onClick={() => router.back()} className="bg-gray-300 text-black px-4 py-2 rounded">취소</button>
      </div>
    </main>
  );
}
