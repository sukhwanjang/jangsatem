'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, resetSupabaseSession } from '@/lib/supabase';

// 로그인 폼 컴포넌트
function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const [redirectingTo, setRedirectingTo] = useState<string | null>(null);

  // 리디렉션 함수 분리
  const redirectToRegister = () => {
    console.log('📝 새 사용자: 추가 정보 입력 페이지로 이동 시도');
    setRedirectingTo('/register');
    
    // 1. localStorage를 통한 강제 리디렉션 정보 저장
    localStorage.setItem('jangsatem_redirect', 'register');
    localStorage.setItem('jangsatem_redirect_time', new Date().getTime().toString());
    
    // 2. 타이머 기반 리디렉션
    setTimeout(() => {
      console.log('⏱️ 리디렉션 타이머 완료');
      router.push('/register');
    }, 2000);
    
    // 3. 추가 백업으로 직접 window.location 사용
    setTimeout(() => {
      if (window.location.pathname !== '/register') {
        console.log('🔄 라우터 방식 실패, window.location으로 리디렉션 시도');
        window.location.href = '/register';
      }
    }, 3000);
  };
  
  const redirectToHome = () => {
    console.log('🏠 기존 사용자: 메인으로 이동');
    setRedirectingTo('/');
    
    setTimeout(() => {
      router.replace('/');
    }, 1000);
  };

  // 로그인 후 #access_token 해시 있으면 처리
  useEffect(() => {
    console.log('🔄 인증 상태 확인');
    
    const handleAuth = async () => {
      // 이미 인증 진행 중인지 확인
      const isAuthInProgress = localStorage.getItem('auth_in_progress') === 'true';
      
      // 해시 포함된 URL인 경우 (OAuth 리디렉션 후)
      if (
        typeof window !== 'undefined' &&
        (window.location.hash.startsWith('#access_token=') || 
         window.location.hash.includes('type=recovery'))
      ) {
        console.log('🔑 소셜 로그인 성공: 액세스 토큰 확인됨');
        setDebugInfo(prev => ({...prev, hash: window.location.hash}));
        
        // URL에서 해시 제거 (새로고침 방지)
        window.history.replaceState(null, '', window.location.pathname);
        
        // localStorage에 로그인 진행 중 표시
        localStorage.setItem('auth_in_progress', 'true');
        
        try {
          // 세션 설정 대기
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Supabase가 해시 처리 완료하도록 대기 - Supabase는 URL 해시를 자동 처리
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('⚠️ 세션 가져오기 실패:', error.message);
            setErrorMessage('세션 처리 중 문제가 발생했습니다: ' + error.message);
            setIsLoading(false);
            localStorage.removeItem('auth_in_progress');
            return;
          }
          
          console.log('✅ 세션 정보 확인:', data.session ? '세션 있음' : '세션 없음');
          checkUserAndRedirect();
        } catch (err: any) {
          console.error('💥 OAuth 콜백 처리 예외:', err?.message || err);
          setErrorMessage('인증 처리 중 오류가 발생했습니다: ' + (err?.message || err));
          setIsLoading(false);
          localStorage.removeItem('auth_in_progress');
        }
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
      
      // JWT 오류 확인
      const errorMessage = localStorage.getItem('auth_error');
      if (errorMessage && errorMessage.includes('JWT')) {
        console.error('❌ JWT 오류 발견:', errorMessage);
        setErrorMessage('인증 오류: ' + errorMessage);
        localStorage.removeItem('auth_error');
        localStorage.removeItem('auth_in_progress');
        
        // 세션 초기화
        await resetSupabaseSession();
        console.log('세션 클리어됨');
        
        setIsLoading(false);
        return;
      }
      
      // 현재 로그인된 유저 확인 - 세션 확인 먼저
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ 세션 조회 에러:', sessionError.message);
        setErrorMessage('세션 조회 중 오류: ' + sessionError.message);
        setIsLoading(false);
        localStorage.removeItem('auth_in_progress');
        return;
      }
      
      // 세션이 없으면 로그인 폼 표시
      if (!sessionData.session) {
        console.log('⚠️ 활성 세션 없음');
        setIsLoading(false);
        localStorage.removeItem('auth_in_progress');
        return;
      }
      
      // 사용자 정보 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ 인증 에러:', userError.message);
        
        // JWT 관련 오류 저장
        if (userError.message.includes('JWT')) {
          localStorage.setItem('auth_error', userError.message);
        }
        
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
      setDebugInfo(prev => ({...prev, user: { id: user.id, email: user.email }}));
      
      // 사용 가능한 테이블 정보 확인 (디버깅용)
      try {
        const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
        if (tablesError) {
          console.error('테이블 목록 조회 실패:', tablesError);
        } else {
          console.log('📊 사용 가능한 테이블:', tables);
          setDebugInfo(prev => ({...prev, tables}));
        }
      } catch (e) {
        console.log('테이블 목록 조회 실패:', e);
      }
      
      // 추가 정보 등록 여부 확인 - 트랜잭션 모델로 양쪽 테이블 모두 확인
      try {
        // 먼저 소문자 테이블 확인
        let userRecord = null;
        let dbError = null;
        
        const { data: existingUser, error: usersError } = await supabase
          .from('users')
          .select('id, username, user_id')
          .eq('user_id', user.id)
          .maybeSingle();
          
        console.log('📝 users 테이블 조회 결과:', existingUser, usersError);
        setDebugInfo(prev => ({...prev, usersQuery: { data: existingUser, error: usersError }}));
        
        // 소문자 테이블 결과가 있으면 저장, 없으면 대문자 테이블 확인
        if (!usersError && existingUser) {
          userRecord = existingUser;
        } else {
          // 대문자 테이블 시도
          const { data: existingUserCaps, error: usersErrorCaps } = await supabase
            .from('Users')
            .select('id, username, user_id')
            .eq('user_id', user.id)
            .maybeSingle();
            
            console.log('📝 Users 테이블(대문자) 조회 결과:', existingUserCaps, usersErrorCaps);
            setDebugInfo(prev => ({...prev, UsersQuery: { data: existingUserCaps, error: usersErrorCaps }}));
            
            if (!usersErrorCaps) {
              userRecord = existingUserCaps;
            } else {
              dbError = usersErrorCaps;
            }
        }
        
        // 결과에 따라 리디렉션 처리
        localStorage.removeItem('auth_in_progress');
        
        if (dbError) {
          console.error('❌ 사용자 정보 조회 실패:', dbError);
          setErrorMessage('사용자 정보 확인 중 오류가 발생했습니다.');
          setIsLoading(false);
          return;
        }
        
        if (!userRecord) {
          redirectToRegister();
        } else {
          redirectToHome();
        }
      } catch (err) {
        console.error('💥 DB 조회 중 예외 발생:', err);
        setDebugInfo(prev => ({...prev, dbError: err}));
        setErrorMessage('데이터베이스 조회 중 오류가 발생했습니다.');
        setIsLoading(false);
        localStorage.removeItem('auth_in_progress');
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
      
      // JWT 관련 문제 해결을 위해 세션 클리어 시도
      await resetSupabaseSession();
      console.log('기존 세션 클리어');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/login`
            : undefined,
          queryParams: {
            prompt: 'consent', // 항상 동의 화면 표시 (캐시된 인증 방지)
          },
        },
      });
      
      if (error) {
        console.error('❌ 로그인 오류:', error.message);
        alert('로그인 오류: ' + error.message);
        setIsLoading(false);
      } else {
        console.log('OAuth 리디렉션 URL:', data?.url);
      }
    } catch (err: any) {
      console.error('💥 OAuth 예외:', err?.message || err);
      alert('OAuth 예외: ' + (err?.message || err));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow relative">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">장사템 로그인</h1>
        
        {/* 디버그 버튼 */}
        <div className="absolute top-2 right-2">
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
          >
            디버그
          </button>
        </div>
        
        {/* 디버그 정보 */}
        {showDebug && (
          <div className="mb-4 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            {redirectingTo && <div className="mt-1 text-green-600">리디렉션 중: {redirectingTo}</div>}
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center py-4">
            <div className="mb-2">처리 중...</div>
            <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="p-4 bg-red-50 text-red-600 rounded mb-4">
                {errorMessage.includes('JWT') || errorMessage.includes('claim') ? 
                  '인증 세션에 문제가 발생했습니다. 다시 로그인해주세요.' : 
                  errorMessage
                }
                {(errorMessage.includes('JWT') || errorMessage.includes('claim')) && (
                  <button 
                    onClick={async () => {
                      try {
                        await resetSupabaseSession();
                        localStorage.removeItem('auth_error');
                        localStorage.removeItem('auth_in_progress');
                        window.location.reload();
                      } catch (e) {
                        console.error('세션 초기화 실패:', e);
                      }
                    }}
                    className="w-full mt-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm py-1 rounded"
                  >
                    세션 초기화 후 다시 시도
                  </button>
                )}
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

// 로그인 페이지 컴포넌트
export default function LoginPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <LoginForm />
    </Suspense>
  );
}
