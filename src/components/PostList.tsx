'use client';

import { Post } from '@/lib/categoryData';
import { useRouter } from 'next/navigation';

interface PostListProps {
  posts: Post[];
  currentCategory: string;
}

export default function PostList({ posts, currentCategory }: PostListProps) {
  const router = useRouter();
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="divide-y divide-gray-100">
        {posts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">게시글이 없습니다.</div>
        ) : (
          posts.map((post) => {
            const [mainCat, subCat] = (post.category || '').split('-');
            return (
              <div
                key={post.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => router.push(`/read/${post.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{post.title}</h3>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span>{post.author}</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      <span className="text-blue-600">{mainCat} - {subCat}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>조회 {post.views}</span>
                    <span>댓글 {post.comment_count}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 