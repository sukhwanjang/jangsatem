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
  user_id: string;
  view_count?: number;
}

interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Like {
  id: number;
  post_id: number;
  user_id: string;
  created_at: string;
}

export default function ReadPage() {
  const pathname = usePathname();
  const idFromPath = pathname?.split('/').pop();
  const numericId = Number(idFromPath);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authorNickname, setAuthorNickname] = useState('익명');
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!numericId || isNaN(numericId)) {
        console.warn("❌ ID가 숫자가 아닙니다.");
        setLoading(false);
        return;
      }

      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("*")
        .eq("id", numericId)
        .single();

      if (postError || !postData) {
        console.error("❌ 게시글 불러오기 실패:", postError);
        setLoading(false);
        return;
      }

      // 조회수 증가 처리
      const currentViewCount = postData.view_count || 0;
      
      // 현재 로그인한 사용자 정보 가져오기
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // 본인 글인지 확인 (작성자와 현재 로그인한 사용자가 동일한지)
      const isOwnPost = currentUser && postData.user_id === currentUser.id;
      
      // 본인 글이 아닌 경우에만 조회수 증가
      if (!isOwnPost) {
        const newViewCount = currentViewCount + 1;
        
        // 조회수 업데이트
        const { error: updateError } = await supabase
          .from("posts")
          .update({ view_count: newViewCount })
          .eq("id", numericId);
        
        if (updateError) {
          console.error("❌ 조회수 업데이트 실패:", updateError);
        } else {
          // 업데이트 성공 시 로컬 상태 변경
          setViewCount(newViewCount);
          postData.view_count = newViewCount;
        }
      } else {
        // 본인 글인 경우 조회수 증가 없이 현재 조회수만 표시
        setViewCount(currentViewCount);
      }

      setPost(postData as Post);

      // 작성자 닉네임 가져오기
      if (postData.user_id) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('nickname')
          .eq('user_id', postData.user_id)
          .single();
          
        if (!userError && userData && userData.nickname) {
          setAuthorNickname(userData.nickname);
        }
      }

      const { data: commentData } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', numericId)
        .order('created_at', { ascending: true });

      if (commentData) setComments(commentData as Comment[]);

      const { data: likeData, error: likeError } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', numericId);

      if (!likeError && likeData) {
        setLikeCount(likeData.length);

        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (user) {
          const liked = likeData.some((like) => like.user_id === user.id);
          setHasLiked(liked);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [numericId]);

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !numericId) return alert("댓글 내용을 입력해주세요.");

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return alert("로그인이 필요합니다");
    }

    const { data: insertData, error: insertError } = await supabase
      .from('comments')
      .insert([
        {
          post_id: numericId,
          user_id: user.id,
          content: commentText,
        },
      ])
      .select();

    if (!insertError && insertData && insertData.length > 0) {
      setComments((prev) => [...prev, insertData[0] as Comment]);
      setCommentText('');
    } else {
      console.error('댓글 작성 실패:', insertError);
      alert('댓글 작성 실패: ' + insertError?.message);
    }
  };

  const handleLike = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return alert('로그인이 필요합니다');
    }

    if (hasLiked) {
      return alert('이미 좋아요를 눌렀습니다');
    }

    const { data, error } = await supabase
      .from('likes')
      .insert([{ post_id: numericId, user_id: user.id }])
      .select();

    if (!error && data) {
      setHasLiked(true);
      setLikeCount((prev) => prev + 1);
    } else {
      console.error('좋아요 실패:', error);
      alert('좋아요 실패');
    }
  };

  if (loading) return <div className="p-10 text-center">불러오는 중...</div>;
  if (!post) return <div className="p-10 text-center text-red-500">잘못된 게시글 ID입니다.</div>;

  return (
    <div className="p-10 max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <div className="text-gray-400 text-sm">{post.region}</div>
        <div className="text-sm text-gray-500">조회수: {viewCount}</div>
      </div>
      
      <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
      
      <div className="mb-4 flex justify-between items-center border-b pb-3">
        <div className="text-gray-600 text-sm">작성자: {authorNickname}</div>
        <div className="text-gray-500 text-sm">{new Date(post.created_at).toLocaleString()}</div>
      </div>
      
      {post.image_url && (
        <img
          src={post.image_url}
          alt="post image"
          className="w-full max-h-96 object-contain rounded-lg border mb-4"
        />
      )}
      <div className="text-gray-700 whitespace-pre-line mb-6">{post.content}</div>

      <div className="flex items-center mb-6 gap-4">
        <button
          onClick={handleLike}
          className={`px-3 py-1 text-sm rounded cursor-pointer ${
            hasLiked ? 'bg-gray-400 text-white' : 'bg-pink-500 text-white hover:bg-pink-600'
          }`}
        >
          ♥ 좋아요
        </button>
        <span className="text-sm text-gray-700">좋아요 {likeCount}개</span>
      </div>

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
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 cursor-pointer"
          >
            댓글달기
          </button>
        </div>
      </div>
    </div>
  );
}
