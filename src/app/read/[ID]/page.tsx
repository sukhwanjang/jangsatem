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

interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
}

export default function ReadPage() {
  const pathname = usePathname();
  const idFromPath = pathname?.split('/').pop();
  const numericId = Number(idFromPath);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
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

      if (data) setPost(data as Post);
      setLoading(false);
    };

    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', numericId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setComments(data as Comment[]);
      } else {
        console.error('댓글 불러오기 실패:', error);
      }
    };

    fetchPost();
    fetchComments();
  }, [numericId]);

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !numericId) return alert("댓글 내용을 입력해주세요.");

    const {
      data: userData,
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.error('사용자 정보를 가져오지 못했습니다:', userError);
      return alert("로그인이 필요합니다");
    }

    const { data: insertData, error: insertError } = await supabase
      .from('comments')
      .insert([
        {
          post_id: numericId,
          user_id: userData.user.id,
          content: commentText,
        },
      ])
      .select();

    if (!insertError && insertData && Array.isArray(insertData) && insertData.length > 0) {
      setComments((prev) => [...prev, insertData[0] as Comment]);
      setCommentText('');
    } else {
      console.error('댓글 작성 오류:', insertError);
      alert('댓글 작성 실패: ' + insertError?.message);
    }
  };

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

      <hr className="my-6" />
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">💬 댓글</h2>

        {comments.map((c) => (
          <div key={c.id} className="bg-gray-50 border p-3 rounded">
            <div className="text-sm text-gray-800">{c.content}</div>
            <div className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString()}</div>
          </div>
        ))}

        <div className="flex gap-2 mt-4">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 border px-3 py-2 rounded text-sm"
            placeholder="댓글을 입력하세요"
          />
          <button
            onClick={handleCommentSubmit}
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            댓글달기
          </button>
        </div>
      </div>
    </div>
  );
}
