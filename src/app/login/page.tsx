'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, clearSession } from '@/lib/supabase';

// 디버그 상태에 대한 타입 정의
interface DebugState {
  showInfo?: boolean;
  user?: { id: string; email: string | null };
  tables?: any;
  Users_query?: { data: any; error: any };
  Users_exception?: any;
  login_error?: any;
  general_error?: any;
  exception?: any;
  [key: string]: any;
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<DebugState | null>(null);
  
  // 로그인 상태 확인 (페이지 로드 시)
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // 리디렉션 중인지 확인
        const isRedirecting = localStorage.getItem('isRedirecting') === 'true';
        if (isRedirecting) {
          console.log('이미 리디렉션 중입니다.');
          return;
        }
        
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
          }, 1500); // 더 긴 대기 시간
          
          return;
        }
        
        // 일반 페이지 로드시 사용자 확인
        if (localStorage.getItem('loginRedirect') !== 'processing') {
          checkUserAndRedirect();
        } else {
          setIsLoading(false);
          localStorage.removeItem('loginRedirect');
        }
      } catch (err: any) {
        console.error('인증 상태 확인 오류:', err.message);
        setDebug({ type: 'auth_status_error', error: err });
      }
    };
    
    checkAuthStatus();
  }, []);

  // 사용자 상태 확인 및 리디렉션
  const checkUserAndRedirect = async () => {
    try {
      setIsLoading(true);
      
      // 현재 세션 가져오기
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('세션 가져오기 오류:', sessionError);
        setError('세션 정보를 가져오는 중 오류가 발생했습니다: ' + sessionError.message);
        setDebug({ type: 'session_error', error: sessionError });
        setIsLoading(false);
        return;
      }
      
      if (!session) {
        console.log('로그인 세션 없음');
        localStorage.removeItem('loginRedirect');
        setIsLoading(false);
        return;
      }
      
      // 사용자 정보 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('사용자 정보 가져오기 오류:', userError);
        setError('사용자 정보를 가져오는 중 오류가 발생했습니다: ' + userError.message);
        setDebug({ type: 'user_error', error: userError });
        setIsLoading(false);
        return;
      }
      
      if (!user) {
        console.log('사용자 정보 없음');
        localStorage.removeItem('loginRedirect');
        setIsLoading(false);
        return;
      }
      
      console.log('로그인된 사용자:', user.id);
      setDebug(prev => ({...prev, user: { id: user.id, email: user.email }}));
      
      // 테이블 목록 확인 (디버깅 용도)
      try {
        const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
        console.log('사용 가능한 테이블:', tables);
        setDebug(prev => ({...prev, tables}));
      } catch (e) {
        console.log('테이블 정보 조회 실패:', e);
      }
      
      // 프로필 변수 선언
      let userProfile = null;
      
      // 대문자 'Users' 테이블 프로필 확인 시도
      try {
        const { data: profile, error: profileError } = await supabase
          .from('Users')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setDebug(prev => ({...prev, 
          Users_query: { data: profile, error: profileError }
        }));
        
        // 대문자 테이블에서 프로필 발견
        if (!profileError && profile) {
          userProfile = profile;
          console.log('기존 사용자(대문자 테이블): 메인 페이지로 이동');
          localStorage.removeItem('loginRedirect');
          
          // 리디렉션 중임을 표시
          localStorage.setItem('isRedirecting', 'true');
          setIsLoading(false);
          
          // 메인 페이지로 이동
          router.push('/');
          
          // 리디렉션 완료 후 플래그 제거 (지연 설정)
          setTimeout(() => {
            localStorage.removeItem('isRedirecting');
          }, 3000);
          
          return;
        }
      } catch (error) {
        console.error('대문자 테이블 조회 예외:', error);
        setDebug(prev => ({...prev, Users_exception: error}));
      }
      
      localStorage.removeItem('loginRedirect');
      
      // 프로필이 없으면 회원가입 페이지로 이동
      if (!userProfile) {
        console.log('추가 정보 필요: 회원가입 페이지로 이동');
        
        // 회원가입 페이지로 이동 시 사용자 정보 로컬 스토리지에 저장
        localStorage.setItem('loginRedirect', 'register');
        localStorage.setItem('auth_user_id', user.id);
        if (user.email) {
          localStorage.setItem('auth_user_email', user.email);
        }
        
        // 회원가입 페이지로 이동
        const registerUrl = '/register';
        router.push(registerUrl);
        
        // 리디렉션 검사
        localStorage.setItem('isRedirecting', 'true');
        setTimeout(() => {
          if (window.location.pathname !== '/register') {
            window.location.href = registerUrl;
          }
        }, 500);
        
        // 리디렉션 완료 후 플래그 제거 (지연 설정)
        setTimeout(() => {
          localStorage.removeItem('isRedirecting');
        }, 5000);
      }
      
    } catch (err: any) {
      console.error('사용자 확인 오류:', err.message);
      localStorage.removeItem('loginRedirect');
      localStorage.removeItem('isRedirecting');
      setError('인증 확인 중 오류가 발생했습니다: ' + err.message);
      setDebug(prev => ({...prev, general_error: err}));
      setIsLoading(false);
    }
  };

  // 소셜 로그인 처리
  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    try {
      // 중복 클릭 방지
      if (isLoading) {
        console.log('이미 로딩 중입니다.');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      setDebug(null);
      
      console.log(`${provider} 로그인 시도 중...`);
      console.log('환경 변수 확인:', !!process.env.NEXT_PUBLIC_SUPABASE_URL, !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      
      // 기존 세션 정리
      await clearSession();
      
      // 소셜 로그인 시작
      console.log('소셜 로그인 시작...');
      const { data, error } = await supabase.auth.signInWithOAuth({
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
        console.error('오류 상세:', error);
        setError('로그인 처리 중 오류가 발생했습니다: ' + error.message);
        setDebug(prev => ({...prev, login_error: error}));
        setIsLoading(false);
      } else if (data && data.url) {
        console.log('OAuth URL 받음:', data.url);
        // 리디렉션 URL이 있으면 이동
        try {
          window.location.href = data.url;
        } catch (redirectError) {
          console.error('리디렉션 오류:', redirectError);
          setError('리디렉션 중 오류가 발생했습니다. URL: ' + data.url);
          setIsLoading(false);
        }
      } else {
        console.error('로그인 데이터 또는 URL이 없음:', data);
        setError('로그인 처리 중 오류가 발생했습니다: 인증 URL을 받지 못했습니다.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('로그인 예외:', err.message);
      console.error('예외 상세:', err);
      setError('로그인 시도 중 문제가 발생했습니다: ' + err.message);
      setDebug(prev => ({...prev, exception: err}));
      setIsLoading(false);
    }
  };
  
  // 세션 초기화 처리
  const handleResetSession = async () => {
    await clearSession();
    localStorage.removeItem('loginRedirect');
    localStorage.removeItem('auth_user_id');
    localStorage.removeItem('auth_user_email');
    localStorage.removeItem('isRedirecting');
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow relative">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">장사템 로그인</h1>
        
        {/* 디버그 버튼들 */}
        <div className="absolute top-2 right-2 flex gap-2">
          <button 
            onClick={() => setDebug(debug ? null : { showInfo: true })}
            className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
          >
            디버그
          </button>
          <button 
            onClick={handleResetSession}
            className="text-xs bg-red-200 hover:bg-red-300 px-2 py-1 rounded"
          >
            세션초기화
          </button>
        </div>
        
        {/* 디버그 정보 */}
        {debug && debug.showInfo && (
          <div className="mb-4 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
            <pre>{JSON.stringify(debug, null, 2)}</pre>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded mb-4">
            <div className="mb-2">{error}</div>
            <button 
              onClick={handleResetSession}
              className="w-full mt-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm py-1 rounded"
            >
              세션 초기화 후 다시 시도
            </button>
            
            {/* 디버그 정보 */}
            {debug && (
              <div className="mt-3 text-xs border-t border-red-200 pt-2">
                <details>
                  <summary className="cursor-pointer">오류 상세 정보</summary>
                  <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(debug, null, 2)}</pre>
                </details>
              </div>
            )}
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
        
        {/* 환경 정보 */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-400">
          <p>운영체제: {typeof window !== 'undefined' ? window.navigator.platform : '알 수 없음'}</p>
          <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '설정안됨'}</p>
        </div>
      </div>
    </div>
  );
}
