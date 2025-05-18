'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Post } from '@/lib/categoryData';
import { supabase } from '@/lib/supabase';

interface PostListProps {
  posts: Post[];
  currentCategory: string;
}

// 데이터베이스에서 필요한 필드 추가
interface ExtendedPost extends Post {
  created_at: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  username?: string;
}

export default function PostList({ posts, currentCategory }: PostListProps) {
  const router = useRouter();
  const [extendedPosts, setExtendedPosts] = useState<ExtendedPost[]>([]);
  
  useEffect(() => {
    const fetchExtendedData = async () => {
      const postsWithCounts = await Promise.all(
        posts.map(async (post) => {
          // 좋아요 수 가져오기
          const { data: likes } = await supabase
            .from('likes')
            .select('*')
            .eq('post_id', post.id);
            
          // 댓글 수 가져오기
          const { data: comments } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', post.id);
            
          // 사용자 정보 가져오기
          let username = '익명';
          if (post.user_id) {
            const { data: userData } = await supabase
              .from('users')
              .select('nickname')
              .eq('user_id', post.user_id)
              .single();
            
            if (userData) {
              username = userData.nickname || '익명';
            }
          }
          
          return {
            ...post,
            created_at: post.created_at || new Date().toISOString(),
            like_count: likes?.length || 0,
            comment_count: comments?.length || 0,
            username
          };
        })
      );
      
      setExtendedPosts(postsWithCounts);
    };
    
    fetchExtendedData();
  }, [posts]);
  
  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    } else {
      return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-bold">{currentCategory} 게시판</h2>
      </div>
      
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr className="border-b">
            <th className="px-4 py-2 text-left font-medium">제목</th>
            <th className="px-2 py-2 text-center font-medium w-24">글쓴이</th>
            <th className="px-2 py-2 text-center font-medium w-20">날짜</th>
            <th className="px-2 py-2 text-center font-medium w-16">조회</th>
            <th className="px-2 py-2 text-center font-medium w-12">좋아요</th>
          </tr>
        </thead>
        <tbody>
          {extendedPosts.length > 0 ? (
            extendedPosts.map((post) => (
              <tr 
                key={post.id} 
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/read/${post.id}`)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-800">{post.title}</span>
                    {(post.comment_count ?? 0) > 0 && (
                      <span className="ml-2 text-blue-500">[{post.comment_count}]</span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-3 text-center text-gray-600">{post.username}</td>
                <td className="px-2 py-3 text-center text-gray-500">{formatDate(post.created_at)}</td>
                <td className="px-2 py-3 text-center text-gray-500">{post.view_count || 0}</td>
                <td className="px-2 py-3 text-center text-gray-500">{post.like_count}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                게시글이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
} 