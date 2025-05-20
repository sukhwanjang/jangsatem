import { Suspense } from 'react';
import MyPageClient from './mypageclient';

export default function MyPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <MyPageClient />
    </Suspense>
  );
} 