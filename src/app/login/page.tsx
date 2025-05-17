'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// 로그인 폼 컴포넌트
function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 로그인 후 #access_token 해시 있으면 처리
  useEffect(() => {
    console.log('🔄 인증 상태 확인');
    
    const handleAuth = async () => {
      // 이미 인증 진행 중인지 확인
      const isAuthInProgress = localStorage.getItem('auth_in_progress') === 'true';
      
      // 해시 포함된 URL인 경우 (OAuth 리디렉션 후)
      if (
        typeof window !== 'undefined' &&
        window.location.hash.startsWith('#access_token=')
      ) {
        console.log('🔑 소셜 로그인 성공: 액세스 토큰 확인됨');
        
        // URL에서 해시 제거 (새로고침 방지)
        window.history.replaceState(null, '', window.location.pathname);
        
        // localStorage에 로그인 진행 중 표시
        localStorage.setItem('auth_in_progress', 'true');
        
        // 충분한 시간 대기 후 사용자 정보 확인
        setTimeout(() => {
          checkUserAndRedirect();
        }, 1500);
        return;
      }
      
      // 일반 페이지 로드 시
      if (!isAuthInProgress) {
        checkUserAndRedirect();
      } else {
        // 이미 인증 처리 중이면 로딩 상태만 해제
        localStorage.removeItem('auth_in_progress');
        setIsLoading(false);
      }
    };
    
    handleAuth();
  }, [router]);

  // 사용자 정보 확인 및 적절한 페이지로 리디렉션
  const checkUserAndRedirect = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 로그인 상태 확인 중...');
      
      // 현재 로그인된 유저 확인
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ 인증 에러:', userError.message);
        setErrorMessage(userError.message);
        setIsLoading(false);
        localStorage.removeItem('auth_in_progress');
        return;
      }
      
      // 로그인 상태가 아니면 로그인 폼 표시
      if (!user) {
        console.log('⚠️ 로그인 상태 아님');
        setIsLoading(false);
        localStorage.removeItem('auth_in_progress');
        return;
      }
      
      console.log('✅ 로그인된 유저:', user.id, user.email);
      
      // 추가 정보 등록 여부 확인
      const { data: existingUser, error: dbError } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
        
      localStorage.removeItem('auth_in_progress');
      
      if (dbError) {
        console.error('❌ DB 조회 에러:', dbError.message);
        setErrorMessage('사용자 정보 확인 중 오류가 발생했습니다.');
        setIsLoading(false);
        return;
      }
      
      // 추가 정보가 없으면 register 페이지로, 있으면 메인으로
      if (!existingUser) {
        console.log('📝 새 사용자: 추가 정보 입력 페이지로 이동');
        router.replace('/register');
      } else {
        console.log('🏠 기존 사용자: 메인으로 이동');
        router.replace('/');
      }
    } catch (err: any) {
      console.error('💥 인증 확인 예외:', err?.message || err);
      setErrorMessage('인증 처리 중 오류가 발생했습니다.');
      setIsLoading(false);
      localStorage.removeItem('auth_in_progress');
    }
  };

  // 소셜 로그인
  const handleLogin = async (provider: 'google' | 'kakao') => {
    try {
      setIsLoading(true);
      console.log(`🚀 ${provider} 로그인 시도...`);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== 'undefined'
            ? window.location.origin + '/login'
            : undefined,
        },
      });
      
      if (error) {
        console.error('❌ 로그인 오류:', error.message);
        alert('로그인 오류: ' + error.message);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('💥 OAuth 예외:', err?.message || err);
      alert('OAuth 예외: ' + (err?.message || err));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">장사템 로그인</h1>
        
        {isLoading ? (
          <div className="text-center py-4">
            <div className="mb-2">처리 중...</div>
            <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="p-4 bg-red-50 text-red-600 rounded mb-4">
                {errorMessage}
              </div>
            )}
            
            <button
              onClick={() => handleLogin('google')}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded mb-3"
            >
              구글로 로그인
            </button>
            <button
              onClick={() => handleLogin('kakao')}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-2 rounded"
            >
              카카오로 로그인
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Suspense로 감싼 메인 컴포넌트
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mb-2">페이지 로딩 중...</div>
          <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
