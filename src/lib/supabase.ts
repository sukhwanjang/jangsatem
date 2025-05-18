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
