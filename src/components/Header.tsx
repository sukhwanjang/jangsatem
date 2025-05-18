'use client';

import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { clearSession } from '@/lib/supabase';

interface HeaderProps {
  user: User | null;
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // 개선된 세션 정리 함수 호출
      const { success, error } = await clearSession();
      if (!success) {
        console.error('로그아웃 중 오류 발생:', error);
        alert('로그아웃 중 오류가 발생했습니다. 페이지를 새로고침하세요.');
      }
      
      // 세션 정리 후 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 로그인 페이지로 리디렉트
      window.location.href = '/login';
    } catch (e) {
      console.error('로그아웃 실패:', e);
      alert('로그아웃 중 오류가 발생했습니다. 페이지를 새로고침하세요.');
      location.reload();
    }
  };

  return (
    <header className="flex justify-end mb-4">
      {user ? (
        <button
          onClick={handleLogout}
          className="px-3 py-1 bg-gray-300 text-sm rounded hover:bg-gray-400"
        >
          로그아웃
        </button>
      ) : (
        <button
          onClick={() => router.push('/login')}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          로그인
        </button>
      )}
    </header>
  );
} 