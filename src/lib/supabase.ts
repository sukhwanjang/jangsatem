import { createClient } from '@supabase/supabase-js';

// 환경 변수 확인 및 기본값 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kbzukawbrbkzuirlumin.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtienVrYXdicmJrenVpcmx1bWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDA4NDgsImV4cCI6MjA2MjM3Njg0OH0.KOx57sIqq7ssy_Ynbn8cgSOY-gGuFzbnq8AG5SRYhPA';

console.log('Supabase 초기화 정보:');
console.log('URL:', supabaseUrl);
console.log('키 설정됨:', !!supabaseAnonKey);

// Supabase 클라이언트 옵션
const supabaseOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit' as const,
  },
};

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

// 세션 초기화 함수
export async function clearSession() {
  try {
    console.log('세션 초기화 시작...');
    
    // 세션 로그아웃 (서버 측)
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('서버 측 로그아웃 오류:', error);
      throw error;
    }
    
    // 로컬 스토리지 정리 (클라이언트 측)
    if (typeof window !== 'undefined') {
      // Supabase 관련 항목 모두 삭제
      const keysToRemove = [
        'supabase.auth.token',
        'supabase.auth.refreshToken', 
        'supabase.auth.access_token',
        'sb-refresh-token',
        'sb-access-token',
        'sb-provider-token',
        'sb-auth-token',
        'loginRedirect',
        'auth_user_id',
        'auth_user_email',
        'isRedirecting'
      ];
      
      // 모든 키 삭제
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`로컬 스토리지 항목 삭제: ${key}`);
        } catch (e) {
          console.warn(`로컬 스토리지 항목 삭제 실패: ${key}`, e);
        }
      });
      
      // Supabase로 시작하는 모든 항목 삭제
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase.') || key.startsWith('sb-')) {
            localStorage.removeItem(key);
            console.log(`추가 항목 삭제: ${key}`);
          }
        });
      } catch (e) {
        console.warn('추가 로컬 스토리지 항목 삭제 실패:', e);
      }
    }
    
    console.log('세션 초기화 완료');
    return { success: true };
  } catch (err) {
    console.error('세션 초기화 실패:', err);
    return { success: false, error: err };
  }
}

// 개발 모드에서 설정 정보 출력
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase 설정 완료');
}
