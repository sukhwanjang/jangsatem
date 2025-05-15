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
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [likes, setLikes] = useState<number>(0);
  const [userLiked, setUserLiked] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!numericId || isNaN(numericId)) {
        console.warn('❌ ID가 숫자가 아닙니다.');
        setLoading(false);
        return;
      }

      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', numericId)
        .single();

      if (postError || !postData) {
        console.error('❌ Supabase 에러:', postError);
        setLoading(false);
        return;
      }

      setPost(postData);

      const { data: commentData } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', numericId)
        .order('created_at', { ascending: true });
      setComments(commentData || []);

      const { data: likeData } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', numericId);
      setLikes(likeData?.length || 0);

      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user.id;
      if (userId) {
        const { data: userLike } = await supabase
          .from('likes')
          .select('*')
          .eq('post_id', numericId)
          .eq('user_id', userId)
          .single();
        setUserLiked(!!userLike);
      }

      setLoading(false);
    };
    fetchData();
  }, [numericId]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    const { data: session } = await supabase.auth.getSession();
    const user = session?.session?.user;
    if (!user) return alert('로그인이 필요합니다');

    const { data, error } = await supabase.from('comments').insert([
      { post_id: numericId, content: newComment }
    ]);

    if (!error) {
      setComments([...comments, { id: Date.now(), post_id: numericId, content: newComment, created_at: new Date().toISOString() }]);
      setNewComment('');
    }
  };

  const handleLike = async () => {
    const { data: session } = await supabase.auth.getSession();
    const user = session?.session?.user;
    if (!user) return alert('로그인이 필요합니다');

    if (userLiked) return;

    await supabase.from('likes').insert([{ post_id: numericId, user_id: user.id }]);
    setLikes((prev) => prev + 1);
    setUserLiked(true);
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

      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={handleLike}
          disabled={userLiked}
          className={`px-4 py-1 rounded text-white ${userLiked ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'}`}
        >
          ❤️ 좋아요 {likes}
        </button>
      </div>

      <div className="border-t pt-4">
        <h2 className="text-lg font-semibold mb-3">💬 댓글</h2>
        <div className="space-y-3 mb-4">
          {comments.map((c) => (
            <div key={c.id} className="bg-gray-100 p-2 rounded">
              <p className="text-sm">{c.content}</p>
              <p className="text-xs text-gray-500 text-right">{new Date(c.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요"
            className="flex-1 border rounded px-3 py-2 text-sm"
          />
          <button
            onClick={handleCommentSubmit}
            className="bg-blue-500 text-white text-sm px-4 py-2 rounded hover:bg-blue-600"
          >
            댓글달기
          </button>
        </div>
      </div>
    </div>
  );
}
