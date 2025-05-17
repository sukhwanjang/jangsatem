import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// JWT 문제 해결을 위한 추가 옵션
const supabaseOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'jangsatem-auth-token',
  },
};

// 클라이언트 생성 시 옵션 추가
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

// 개발 모드에서 디버깅 정보 출력
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔑 Supabase 설정 완료:', { url: supabaseUrl, options: supabaseOptions });
}
