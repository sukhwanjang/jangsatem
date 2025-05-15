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
  content: string;
  created_at: string;
}

export default function ReadPage() {
  const pathname = usePathname();
  const idFromPath = pathname?.split('/').pop();
  const numericId = Number(idFromPath);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      if (!numericId || isNaN(numericId)) {
        setLoading(false);
        return;
      }

      const { data: postData } = await supabase
        .from('posts')
        .select('*')
        .eq('id', numericId)
        .single();

      const { data: commentData } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', numericId)
        .order('created_at', { ascending: true });

      const { data: likeData } = await supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .eq('post_id', numericId);

      if (postData) setPost(postData);
      if (commentData) setComments(commentData);
      if (likeData) setLikeCount(likeData.length);

      setLoading(false);
    };

    fetchPostAndComments();
  }, [numericId]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    const { data: insertedComment, error } = await supabase
      .from('comments')
      .insert({ content: newComment, post_id: numericId })
      .select()
      .single();

    if (!error && insertedComment) {
      setComments([...comments, insertedComment]);
      setNewComment('');
    }
  };

  const handleLike = async () => {
    await supabase.from('likes').insert({ post_id: numericId });
    setLikeCount((prev) => prev + 1);
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
      <div className="text-gray-700 whitespace-pre-line mb-6">{post.content}</div>

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleLike}
          className="px-3 py-1 text-sm bg-pink-100 hover:bg-pink-200 text-pink-600 rounded"
        >
          ❤️ 좋아요 ({likeCount})
        </button>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-bold mb-2">💬 댓글</h2>
        <div className="space-y-4 mb-4">
          {comments.map((comment) => (
            <div key={comment.id} className="p-3 bg-gray-50 border rounded">
              <div className="text-sm text-gray-800 whitespace-pre-line">{comment.content}</div>
              <div className="text-xs text-gray-400 mt-1">{new Date(comment.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요"
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
