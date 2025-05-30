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
  sessionClearError?: any;
  authException?: any;
  hash_detected?: boolean;
  hash_value?: string;
  previous_provider?: string;
  location_hash?: string;
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
        
        // URL 해시 확인 (OAuth 인증 후 리디렉션)
        const hasAuthHash = window.location.hash && 
          (window.location.hash.includes('access_token=') || 
           window.location.hash.includes('type=recovery') ||
           window.location.hash.includes('provider='));
           
        if (hasAuthHash) {
          console.log('소셜 로그인 콜백 감지:', window.location.hash);
          localStorage.setItem('loginRedirect', 'processing');
          
          // 해시 검사
          try {
            // 해시 제거 (브라우저 히스토리에서 제거)
            window.history.replaceState(null, '', window.location.pathname);
            
            // 참고: Supabase는 URL 해시를 자동으로 처리함
            // 상태 업데이트
            setIsLoading(true);
            setDebug((prev) => ({
              ...prev,
              hash_detected: true,
              hash_value: window.location.hash
            }));
          } catch (hashError) {
            console.error('해시 처리 오류:', hashError);
          }
          
          // 잠시 기다린 후 상태 확인 (Supabase가 토큰 처리 완료하도록)
          setTimeout(() => {
            checkUserAndRedirect();
          }, 2000); // 더 긴 대기 시간
          
          return;
        }
        
        // 일반 페이지 로드시 사용자 확인
        if (localStorage.getItem('loginRedirect') !== 'processing') {
          const previousProvider = localStorage.getItem('oauthProvider');
          if (previousProvider) {
            console.log('이전 소셜 인증 공급자 감지:', previousProvider);
            setDebug((prev) => ({
              ...prev,
              previous_provider: previousProvider 
            }));
          }
          
          // 세션 확인 전 잠시 대기 (브라우저 로드 완료 대기)
          setTimeout(() => {
            checkUserAndRedirect();
          }, 500);
        } else {
          console.log('로그인 리디렉션 진행중, 세션 체크 스킵');
          setIsLoading(false);
          localStorage.removeItem('loginRedirect');
        }
      } catch (err: any) {
        console.error('인증 상태 확인 오류:', err.message);
        setDebug((prev) => ({
          ...prev, 
          type: 'auth_status_error', 
          error: err,
          location_hash: window.location.hash
        }));
        setIsLoading(false);
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
      
      // 소문자 'users' 테이블 확인 시도
      try {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setDebug(prev => ({...prev, 
          users_query: { data: profile, error: profileError }
        }));
        
        // 소문자 테이블에서 프로필 발견
        if (!profileError && profile) {
          userProfile = profile;
          console.log('기존 사용자(소문자 테이블): 메인 페이지로 이동');
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
        console.error('소문자 테이블 조회 예외:', error);
        setDebug(prev => ({...prev, users_exception: error}));
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
      const { success, error: sessionError } = await clearSession();
      
      if (!success) {
        console.error('세션 초기화 실패:', sessionError);
        setDebug(prev => ({...prev, sessionClearError: sessionError}));
        // 실패해도 계속 진행 (비정상 세션 상태일 수 있음)
      }
      
      // 로그인 시도 전 잠시 대기 (세션 정리 시간 확보)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 소셜 로그인 시작
      console.log('소셜 로그인 시작...');
      
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/login`,
            queryParams: {
              prompt: 'select_account', // 항상 계정 선택 화면 표시
            },
            skipBrowserRedirect: false
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
          
          // 리디렉션 상태 저장
          localStorage.setItem('loginRedirect', 'starting');
          localStorage.setItem('oauthProvider', provider);
          
          // 리디렉션 URL이 있으면 이동
          try {
            // 새 창이나 탭에서 열기
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
      } catch (authError: any) {
        console.error('인증 시도 예외:', authError);
        setError('인증 시도 중 예외가 발생했습니다: ' + authError.message);
        setDebug(prev => ({...prev, authException: authError}));
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
    try {
      console.log('세션 초기화 시작...');
      setIsLoading(true);
      
      // 개선된 세션 정리 함수 사용
      const { success, error } = await clearSession();
      
      // 로컬 쿠키 정리 (추가 조치)
      try {
        // 모든 쿠키 삭제 시도
        document.cookie.split(';').forEach(function(c) {
          document.cookie = c.trim().split('=')[0] + 
            '=;expires=' + new Date(0).toUTCString() + 
            ';path=/';
        });
      } catch (cookieErr) {
        console.warn('쿠키 삭제 실패:', cookieErr);
      }
      
      setIsLoading(false);
      
      if (!success) {
        console.error('세션 초기화 실패:', error);
        setError('세션 초기화에 실패했습니다. 페이지를 새로고침합니다...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        return;
      }
      
      console.log('세션 초기화 완료, 페이지 새로고침...');
      setTimeout(() => {
        window.location.href = '/login?reset=' + Date.now();
      }, 500);
    } catch (err) {
      console.error('세션 초기화 중 오류 발생:', err);
      setError('세션 초기화 중 오류가 발생했습니다.');
      setIsLoading(false);
      
      // 오류 발생 시에도 페이지 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
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
