'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('세션 에러:', error.message);
        return;
      }

      if (session) {
        // 유저가 추가 정보 입력 필요 여부를 판단
        const { data: userExists, error: fetchError } = await supabase
          .from('Users')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (fetchError) {
          console.error('DB 조회 에러:', fetchError.message);
        }

        if (userExists) {
          router.replace('/');
        } else {
          router.replace('/login');
        }
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600 text-lg">로그인 처리 중입니다...</p>
    </div>
  );
}
