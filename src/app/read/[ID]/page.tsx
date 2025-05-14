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
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericId = typeof id === 'string' ? parseInt(id, 10) : NaN;

  useEffect(() => {
    if (isNaN(numericId)) {
      setError('잘못된 게시글 ID입니다.');
      return;
    }

    const fetchPost = async () => {
      const { data, error } = await supabase.from('posts').select('*').eq('id', numericId).single();
      if (error || !data) {
        setError('게시글을 찾을 수 없습니다.');
        return;
      }
      setPost(data);
    };

    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', numericId)
        .order('created_at', { ascending: true });
      setComments(data || []);
    };

    const fetchLikes = async () => {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', numericId);
      setLikes(count || 0);
    };

    fetchPost();
    fetchComments();
    fetchLikes();
  }, [numericId]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    const { error } = await supabase.from('comments').insert({
      post_id: numericId,
      content: newComment,
    });

    if (!error) {
      setComments((prev) => [
        ...prev,
        { id: Date.now(), post_id: numericId, content: newComment, created_at: new Date().toISOString() },
      ]);
      setNewComment('');
    }
  };

  const handleLike = async () => {
    if (hasLiked) return;

    const { error } = await supabase.from('likes').insert({
      post_id: numericId,
    });

    if (!error) {
      setLikes((prev) => prev + 1);
      setHasLiked(true);
    }
  };

  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
  if (!post) return <div className="p-10 text-center">불러오는 중...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-4 text-sm text-gray-500">
        {post.region} &gt; {post.title}
      </div>
      <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

      {post.image_url && (
        <img
          src={post.image_url}
          alt="post image"
          className="w-full max-h-96 object-contain mb-4 rounded-lg border"
        />
      )}

      <div className="text-gray-800 whitespace-pre-line mb-6">{post.content}</div>

      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={handleLike}
          disabled={hasLiked}
          className={`px-4 py-1 rounded text-sm font-medium transition ${
            hasLiked ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          👍 추천 {likes}
        </button>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-2">💬 댓글</h2>
        <div className="space-y-3 mb-4">
          {comments.map((comment) => (
            <div key={comment.id} className="p-3 bg-gray-50 border rounded text-sm">
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
