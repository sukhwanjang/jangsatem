'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Post {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  region: string;
  created_at: string;
}

export default function ReadPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = typeof rawId === 'string' ? parseInt(rawId, 10) : Array.isArray(rawId) ? parseInt(rawId[0], 10) : NaN;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || isNaN(id)) {
      console.log('❌ 잘못된 ID:', rawId);
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('🔴 Supabase fetch error:', error);
        setPost(null);
      } else {
        setPost(data);
      }

      setLoading(false);
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return <div className="p-10 text-center text-gray-500">불러오는 중...</div>;
  }

  if (!post) {
    return <div className="p-10 text-center text-red-500">잘못된 게시글 ID입니다.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-2 text-sm text-gray-500">
        {post.region} &gt; {post.title}
      </div>
      <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

      {post.image_url && (
        <img
          src={post.image_url}
          alt="게시글 이미지"
          className="w-full max-h-96 object-contain rounded-lg mb-4"
        />
      )}

      <div className="whitespace-pre-wrap text-gray-800 text-base leading-relaxed">
        {post.content}
      </div>
    </div>
  );
}
