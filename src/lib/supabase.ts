import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// JWT 문제 해결을 위한 개선된 옵션
const supabaseOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'jangsatem-auth-token',
    flowType: 'implicit' as const,  // 타입 명시
    debug: process.env.NODE_ENV === 'development',  // 개발 모드에서 디버깅 활성화
    // 추가 옵션 설정
    retryAttempts: 3,         // 세션 갱신 재시도 횟수
    retryInterval: 2000,      // 재시도 간격 (ms)
  },
  global: {
    headers: { 'x-application-name': 'jangsatem' },
  },
};

// 클라이언트 생성 시 옵션 추가
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

// 세션 초기화 함수 - JWT 관련 문제 발생 시 호출
export async function resetSupabaseSession() {
  try {
    // 세션 관련 스토리지 직접 제거
    if (typeof window !== 'undefined') {
      // Supabase 관련 스토리지 제거
      localStorage.removeItem('jangsatem-auth-token');
      localStorage.removeItem('supabase.auth.token');
      
      // 애플리케이션 관련 스토리지 제거
      localStorage.removeItem('auth_in_progress');
      localStorage.removeItem('auth_error');
    }
    
    // 세션 종료
    await supabase.auth.signOut();
    console.log('🧹 Supabase 세션 초기화 완료');
  } catch (err) {
    console.error('세션 초기화 실패:', err);
  }
}

// 개발 모드에서 디버깅 정보 출력
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔑 Supabase 설정 완료:', { url: supabaseUrl, options: supabaseOptions });
  
  // 개발용 세션 모니터링
  const interval = setInterval(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log('🔒 세션 유효함 - 만료까지:', new Date(data.session.expires_at! * 1000));
      }
    } catch (e) {
      console.error('세션 모니터링 오류:', e);
    }
  }, 60000);  // 1분마다 확인
}
