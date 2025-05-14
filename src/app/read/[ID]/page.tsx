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

interface Comment {
  id: number;
  post_id: number;
  content: string;
  created_at: string;
}

export default function ReadPage() {
  const params = useParams();
  const idParam = typeof params.id === 'string' ? Number(params.id) : NaN;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [error, setError] = useState('');

  // 게시글 및 관련 데이터 불러오기
  useEffect(() => {
    if (isNaN(idParam)) {
      setError('잘못된 게시글 ID입니다.');
      return;
    }

    const fetchPost = async () => {
      const { data, error } = await supabase.from('posts').select('*').eq('id', idParam).single();
      if (!data || error) {
        setError('게시글을 찾을 수 없습니다.');
      } else {
        setPost(data);
      }
    };

    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', idParam)
        .order('created_at', { ascending: true });
      setComments(data || []);
    };

    const fetchLikes = async () => {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', idParam);
      setLikes(count || 0);
    };

    fetchPost();
    fetchComments();
    fetchLikes();
  }, [idParam]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    const { error } = await supabase.from('comments').insert({
      post_id: idParam,
      content: newComment,
    });

    if (!error) {
      setComments((prev) => [...prev, {
        id: Date.now(),
        post_id: idParam,
        content: newComment,
        created_at: new Date().toISOString(),
      }]);
      setNewComment('');
    }
  };

  const handleLike = async () => {
    if (hasLiked) return;

    const { error } = await supabase.from('likes').insert({
      post_id: idParam,
    });

    if (!error) {
      setLikes((prev) => prev + 1);
      setHasLiked(true);
    }
  };

  if (error) {
    return <div className="text-center text-red-500 py-10">{error}</div>;
  }

  if (!post) {
    return <div className="text-center text-gray-500 py-10">불러오는 중...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-4 text-sm text-gray-500">
        {post.region}
      </div>
      <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

      {post.image_url && (
        <img
          src={post.image_url}
          alt="게시글 이미지"
          className="w-full max-h-96 object-contain mb-4 rounded border"
        />
      )}

      <div className="whitespace-pre-line text-gray-800 mb-6">
        {post.content}
      </div>

      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={handleLike}
          disabled={hasLiked}
          className={`px-4 py-1 rounded text-sm font-medium transition ${
            hasLiked
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          👍 추천 {likes}
        </button>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-2">💬 댓글</h2>
        <div className="space-y-3 mb-4">
          {comments.map((comment) => (
            <div key={comment.id} className="p-3 bg-gray-100 rounded text-sm">
              {comment.content}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력해주세요"
            className="flex-1 border px-3 py-2 rounded text-sm"
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
