import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
    // 로컬 스토리지 정리
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('loginRedirect');
    }
    
    // 세션 로그아웃
    await supabase.auth.signOut();
    console.log('세션 초기화 완료');
  } catch (err) {
    console.error('세션 초기화 실패:', err);
  }
}

// 개발 모드에서 설정 정보 출력
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase 설정 완료');
}
