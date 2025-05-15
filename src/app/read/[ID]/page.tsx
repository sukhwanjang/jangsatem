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
  const postId = Number(params?.id);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // 게시글 가져오기
      const { data: postData } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (!postData) {
        setPost(null);
        setLoading(false);
        return;
      }

      setPost(postData);

      // 댓글
      const { data: commentData } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      // 좋아요 수
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      setComments(commentData || []);
      setLikes(count || 0);
      setLoading(false);
    };

    if (postId) fetchData();
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
          id: Date.now(),
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

    const { error } = await supabase.from('likes').insert({ post_id: postId });

    if (!error) {
      setLikes((prev) => prev + 1);
      setHasLiked(true);
    }
  };

  if (loading) return <div className="text-center mt-20">불러오는 중...</div>;
  if (!post) return <div className="text-center mt-20 text-red-500">잘못된 게시글 ID입니다.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
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
            <div
              key={comment.id}
              className="p-3 bg-gray-50 border rounded text-sm"
            >
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