'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, clearSession } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 로그인 상태 확인 (페이지 로드 시)
  useEffect(() => {
    const checkAuthStatus = async () => {
      // 해시 URL 확인 (소셜 로그인 리디렉션 후)
      const hasAuthHash = window.location.hash && 
        (window.location.hash.includes('access_token=') || 
         window.location.hash.includes('type=recovery'));
         
      if (hasAuthHash) {
        console.log('소셜 로그인 콜백 감지');
        localStorage.setItem('loginRedirect', 'processing');
        
        // 해시 제거 (브라우저 히스토리에서 제거)
        window.history.replaceState(null, '', window.location.pathname);
        
        // 잠시 기다린 후 상태 확인 (Supabase가 토큰 처리 완료하도록)
        setTimeout(() => {
          checkUserAndRedirect();
        }, 1000);
        
        return;
      }
      
      // 일반 페이지 로드시 사용자 확인
      if (localStorage.getItem('loginRedirect') !== 'processing') {
        checkUserAndRedirect();
      } else {
        setIsLoading(false);
        localStorage.removeItem('loginRedirect');
      }
    };
    
    checkAuthStatus();
  }, []);

  // 사용자 상태 확인 및 리디렉션
  const checkUserAndRedirect = async () => {
    try {
      setIsLoading(true);
      
      // 현재 세션 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('로그인 세션 없음');
        localStorage.removeItem('loginRedirect');
        setIsLoading(false);
        return;
      }
      
      // 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('사용자 정보 없음');
        localStorage.removeItem('loginRedirect');
        setIsLoading(false);
        return;
      }
      
      console.log('로그인된 사용자:', user.id);
      
      // 사용자 프로필 정보 확인
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      localStorage.removeItem('loginRedirect');
      
      // 프로필이 없으면 회원가입 페이지로 이동
      if (!profile) {
        console.log('추가 정보 필요: 회원가입 페이지로 이동');
        
        // 회원가입 페이지로 이동 시 사용자 정보 로컬 스토리지에 저장
        localStorage.setItem('loginRedirect', 'register');
        localStorage.setItem('auth_user_id', user.id);
        if (user.email) {
          localStorage.setItem('auth_user_email', user.email);
        }
        
        // 회원가입 페이지로 이동
        router.push('/register');
      } else {
        // 프로필이 있으면 메인 페이지로
        console.log('기존 사용자: 메인 페이지로 이동');
        router.push('/');
      }
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('사용자 확인 오류:', err.message);
      localStorage.removeItem('loginRedirect');
      setError('인증 확인 중 오류가 발생했습니다');
      setIsLoading(false);
    }
  };

  // 소셜 로그인 처리
  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 기존 세션 정리
      await clearSession();
      
      // 소셜 로그인 시작
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: {
            prompt: 'consent', // 항상 동의 화면 표시
          }
        }
      });
      
      if (error) {
        console.error('로그인 오류:', error.message);
        setError('로그인 처리 중 오류가 발생했습니다');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('로그인 예외:', err.message);
      setError('로그인 시도 중 문제가 발생했습니다');
      setIsLoading(false);
    }
  };
  
  // 세션 초기화 처리
  const handleResetSession = async () => {
    await clearSession();
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">장사템 로그인</h1>
        
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded mb-4">
            {error}
            <button 
              onClick={handleResetSession}
              className="w-full mt-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm py-1 rounded"
            >
              세션 초기화 후 다시 시도
            </button>
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center py-4">
            <div className="mb-2">처리 중...</div>
            <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <>
            <p className="text-center text-gray-600 mb-4">소셜 계정으로 로그인하세요</p>
            <button
              onClick={() => handleSocialLogin('google')}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded mb-3"
              disabled={isLoading}
            >
              구글로 로그인
            </button>
            <button
              onClick={() => handleSocialLogin('kakao')}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-2 rounded"
              disabled={isLoading}
            >
              카카오로 로그인
            </button>
          </>
        )}
      </div>
    </div>
  );
}
