'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Props {
  region: string;
}

export default function WriteClient({ region }: Props) {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!title || !content) return alert('제목과 내용을 입력해주세요.');
    setLoading(true);

    let imageUrl = null;
    if (image) {
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(`posts/${Date.now()}-${image.name}`, image);

      if (error) {
        alert('이미지 업로드 실패');
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(data.path);
      imageUrl = urlData.publicUrl;
    }

    const { error: insertError } = await supabase.from('posts').insert([
      {
        title,
        content,
        region,
        image_url: imageUrl,
      },
    ]);

    if (insertError) {
      alert('글 등록 실패: ' + insertError.message);
    } else {
      alert('등록 완료!');
      router.push('/');
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-xl shadow">
      {/* ✅ 목록으로 버튼 */}
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-blue-600 hover:underline"
      >
        ← 목록으로
      </button>

      <h1 className="text-2xl font-bold mb-4 text-blue-700">✏️ 글쓰기 - {region}</h1>

      <input
        type="text"
        placeholder="제목을 입력하세요"
        className="w-full p-2 mb-4 border rounded"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        placeholder="내용을 입력하세요"
        className="w-full h-40 p-2 mb-4 border rounded resize-none"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="mb-4"
      />

      {previewUrl && (
        <img
          src={previewUrl}
          alt="미리보기"
          className="w-full h-48 object-cover mb-4 rounded border"
        />
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full py-2 rounded text-white font-semibold ${
          loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? '업로드 중...' : '등록하기'}
      </button>
    </div>
  );
}
