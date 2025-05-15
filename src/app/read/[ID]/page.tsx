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
  const postId = Number(id); // 중요: 문자열 ID를 숫자로 변환

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  // 게시글, 댓글, 좋아요 불러오기
  useEffect(() => {
    if (!postId || isNaN(postId)) return;

    const fetchData = async () => {
      setLoading(true);

      const { data: postData } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      const { data: commentData } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      setPost(postData || null);
      setComments(commentData || []);
      setLikes(count || 0);
      setLoading(false);
    };

    fetchData();
  }, [postId]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      content: newComment,
    });

    if (!error) {
      setComments((prev) => [
        ...prev,
        {
          id: Date.now(), // 임시 ID
          post_id: postId,
          content: newComment,
          created_at: new Date().toISOString(),
        },
      ]);
      setNewComment('');
    }
  };

  const handleLike = async () => {
    if (hasLiked) return;

    const { error } = await supabase.from('likes').insert({
      post_id: postId,
    });

    if (!error) {
      setLikes((prev) => prev + 1);
      setHasLiked(true);
    }
  };

  if (!postId || isNaN(postId)) {
    return <div className="p-10 text-center text-red-500">잘못된 게시글 ID입니다.</div>;
  }

  if (loading) {
    return <div className="p-10 text-center">불러오는 중...</div>;
  }

  if (!post) {
    return <div className="p-10 text-center text-red-500">게시글을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-2 text-sm text-gray-500">{post.region}</div>
      <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

      {post.image_url && (
        <img
          src={post.image_url}
          alt="post"
          className="w-full max-h-[400px] object-contain rounded-lg border mb-4"
        />
      )}

      <div className="text-gray-800 whitespace-pre-wrap mb-6">{post.content}</div>

      <div className="mb-8">
        <button
          onClick={handleLike}
          disabled={hasLiked}
          className={`px-4 py-2 rounded text-sm font-medium ${
            hasLiked
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          👍 추천 {likes}
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">💬 댓글</h2>
        <div className="space-y-3 mb-4">
          {comments.map((comment) => (
            <div key={comment.id} className="p-3 bg-gray-100 border rounded text-sm">
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
