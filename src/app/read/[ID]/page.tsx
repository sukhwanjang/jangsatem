'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const idFromPath = pathname?.split('/').pop(); // 마지막 segment 추출
  const numericId = Number(idFromPath);

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      console.log('✅ 최종 추출된 게시글 ID:', numericId);

      if (!numericId || isNaN(numericId)) {
        console.warn("❌ ID가 숫자가 아닙니다.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", numericId)
        .single();

      if (error) {
        console.error("❌ Supabase 에러:", error);
        setLoading(false);
        return;
      }

      if (data) {
        setPost(data);
      }

      setLoading(false);
    };

    fetchPost();
  }, [numericId]);

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
