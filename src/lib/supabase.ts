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
  },
};

// 클라이언트 생성 시 옵션 추가
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

// 세션 초기화 함수 - JWT 관련 문제 발생 시 호출
export async function resetSupabaseSession() {
  try {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jangsatem-auth-token');
      console.log('🧹 Supabase 세션 초기화 완료');
    }
  } catch (err) {
    console.error('세션 초기화 실패:', err);
  }
}

// 개발 모드에서 디버깅 정보 출력
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔑 Supabase 설정 완료:', { url: supabaseUrl, options: supabaseOptions });
}
