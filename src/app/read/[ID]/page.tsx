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
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const numericId = Number(params?.id);
  console.log('🔥 post ID from route:', params?.id, numericId);

  useEffect(() => {
    const fetchPost = async () => {
      if (!numericId || isNaN(numericId)) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', numericId)
        .single();

      if (error || !data) {
        console.error('❌ Supabase Error:', error);
        setLoading(false);
        return;
      }

      setPost(data);
      setLoading(false);
    };

    fetchPost();
  }, [numericId]);

  if (loading) return <div className="p-10 text-center">불러오는 중...</div>;
  if (!post) return <div className="p-10 text-center text-red-500">잘못된 게시글 ID입니다.</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
      <div className="text-gray-500 text-sm mb-2">{post.region}</div>
      {post.image_url && (
        <img src={post.image_url} className="w-full mb-4 rounded border" alt="Post" />
      )}
      <div className="text-gray-800 whitespace-pre-line">{post.content}</div>
    </div>
  );
}
