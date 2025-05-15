"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

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
  const params = useParams();
  const numericId = Number(params?.id);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState<User | null>(null);

  // 게시글 불러오기
  useEffect(() => {
    const fetchPost = async () => {
      if (!numericId || isNaN(numericId)) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", numericId)
        .single();

      if (error) {
        console.error("Post fetch error:", error);
        setLoading(false);
        return;
      }

      setPost(data);
      setLoading(false);
    };

    fetchPost();
  }, [numericId]);

  // 댓글 & 사용자 불러오기
  useEffect(() => {
    const loadUserAndComments = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      fetchComments();
    };

    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", numericId)
        .order("created_at", { ascending: true });

      if (!error && data) setComments(data);
    };

    if (numericId) {
      loadUserAndComments();
    }
  }, [numericId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const { error } = await supabase.from("comments").insert([
      {
        post_id: numericId,
        user_id: user.id,
        content: newComment,
      },
    ]);

    if (!error) {
      setNewComment("");
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", numericId)
        .order("created_at", { ascending: true });
      if (data) setComments(data);
    }
  };

  if (loading) return <div className="p-10 text-center">불러오는 중...</div>;
  if (!post) return <div className="p-10 text-center text-red-500">잘못된 게시글 ID입니다.</div>;

  return (
    <div className="p-10 max-w-2xl mx-auto">
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

      {/* 댓글 목록 */}
      <div className="mt-10">
        <h2 className="text-lg font-bold mb-3">💬 댓글</h2>
        {comments.length === 0 ? (
          <p className="text-gray-500">아직 댓글이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {comments.map((comment) => (
              <li key={comment.id} className="p-3 border rounded bg-gray-50">
                <p className="text-sm text-gray-700 whitespace-pre-line">{comment.content}</p>
                <p className="text-xs text-gray-400 text-right">
                  {new Date(comment.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 댓글 작성 */}
      {user && (
        <form onSubmit={handleCommentSubmit} className="mt-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요"
            className="w-full border rounded p-2 mb-2 text-sm resize-none"
            rows={3}
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            댓글 작성
          </button>
        </form>
      )}
    </div>
  );
}
