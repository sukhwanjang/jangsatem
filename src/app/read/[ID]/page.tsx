'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Post {
  id: number;
  title: string;
  content: string;
  region: string;
  image_url?: string;
  created_at: string;
}

export default function ReadPage() {
  const params = useParams();
  const id = params?.id?.toString() || '';
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      console.log('📌 URL에서 받은 ID:', id);

      if (!id || isNaN(Number(id))) {
        console.warn('❌ 숫자가 아닌 ID');
        setLoading(false);
        return;
      }

      const numericId = Number(id);

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', numericId)
        .maybeSingle(); // ❗ maybeSingle()은 data가 없어도 에러를 안 던짐

      console.log('📌 Supabase 응답:', { data, error });

      if (error || !data) {
        setPost(null);
      } else {
        setPost(data);
      }

      setLoading(false);
    };

    fetchPost();
  }, [id]);

  if (loading) return <div className="p-10 text-center">불러오는 중...</div>;
  if (!post) return <div className="p-10 text-center text-red-500">잘못된 게시글 ID입니다.</div>;

  return (
    <div className="p-10 max-w-xl mx-auto">
      <div className="text-gray-400 text-sm mb-2">{post.region}</div>
      <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
      {post.image_url && (
        <img
          src={post.image_url}
          alt="post image"
          className="w-full max-h-96 object-contain rounded-lg border mb-4"
        />
      )}
      <div className="text-gray-700 whitespace-pre-line mb-10">{post.content}</div>
    </div>
  );
}
