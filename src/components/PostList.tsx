'use client';

import { useState, useEffect, useMemo } from 'react';
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
  author_nickname?: string;
}

export default function PostList({ posts, currentCategory }: PostListProps) {
  const router = useRouter();
  const [extendedPosts, setExtendedPosts] = useState<ExtendedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 가져온 posts에 이미 확장 필드가 있는지 확인
  const postsHaveExtendedData = useMemo(() => {
    return posts.length > 0 && 
      (posts[0] as any).like_count !== undefined &&
      (posts[0] as any).author_nickname !== undefined;
  }, [posts]);
  
  useEffect(() => {
    const fetchExtendedData = async () => {
      try {
        setIsLoading(true);
        
        // 이미 확장 데이터가 있으면 추가 API 호출 없이 바로 사용
        if (postsHaveExtendedData) {
          setExtendedPosts(posts as ExtendedPost[]);
          setIsLoading(false);
          return;
        }
        
        const postsWithCounts = await Promise.all(
          posts.map(async (post) => {
            // 기본값 설정
            let likeCount = 0;
            let commentCount = 0;
            let authorNickname = '익명';
            
            // 병렬로 좋아요와 댓글 수 가져오기
            const [likesResult, commentsResult] = await Promise.all([
              supabase.from('likes').select('id').eq('post_id', post.id),
              supabase.from('comments').select('id').eq('post_id', post.id)
            ]);
            
            if (likesResult.data) likeCount = likesResult.data.length;
            if (commentsResult.data) commentCount = commentsResult.data.length;
            
            // 사용자 정보 가져오기
            if (post.user_id) {
              try {
                // 소문자와 대문자 users 테이블을 병렬로 조회
                const [userResult, upperUserResult] = await Promise.all([
                  supabase.from('users').select('nickname').eq('user_id', post.user_id).single(),
                  supabase.from('Users').select('nickname').eq('user_id', post.user_id).single()
                ]);
                
                if (userResult.data?.nickname) {
                  authorNickname = userResult.data.nickname;
                } else if (upperUserResult.data?.nickname) {
                  authorNickname = upperUserResult.data.nickname;
                } else {
                  // ID 기반 조회 필요 시 추가 조회
                  const [idUserResult, idUpperUserResult] = await Promise.all([
                    supabase.from('users').select('nickname').eq('id', post.user_id).single(),
                    supabase.from('Users').select('nickname').eq('id', post.user_id).single()
                  ]);
                  
                  if (idUserResult.data?.nickname) {
                    authorNickname = idUserResult.data.nickname;
                  } else if (idUpperUserResult.data?.nickname) {
                    authorNickname = idUpperUserResult.data.nickname;
                  }
                }
              } catch (error) {
                console.error("게시글 작성자 정보 조회 중 오류:", error);
              }
            }
            
            return {
              ...post,
              created_at: post.created_at || new Date().toISOString(),
              like_count: likeCount,
              comment_count: commentCount,
              author_nickname: authorNickname
            };
          })
        );
        
        setExtendedPosts(postsWithCounts);
      } catch (error) {
        console.error("게시글 확장 데이터 가져오기 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExtendedData();
  }, [posts, postsHaveExtendedData]);
  
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
        <h2 className="text-lg font-bold">{currentCategory}</h2>
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
          {isLoading ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                불러오는 중...
              </td>
            </tr>
          ) : extendedPosts.length > 0 ? (
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
                <td className="px-2 py-3 text-center text-gray-600">{post.author_nickname || '익명'}</td>
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