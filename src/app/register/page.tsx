'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// SearchParams를 사용하는 컴포넌트 분리
function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [region, setRegion] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        console.log('🔍 사용자 인증 상태 확인 중...');
        
        // 현재 인증된 유저 정보 가져오기
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('❌ 인증 에러:', userError.message);
          setError('인증에 실패했습니다. 다시 로그인해주세요.');
          setIsLoading(false);
          return;
        }
        
        if (!user) {
          console.log('⚠️ 인증된 사용자 없음, 로그인 페이지로 이동');
          setError('로그인이 필요합니다.');
          setTimeout(() => {
            router.replace('/login');
          }, 2000);
          return;
        }
        
        console.log('✅ 인증된 유저:', user.id, user.email);
        setUserId(user.id);
        setUserEmail(user.email || null);
        
        // 이미 추가 정보가 등록되어 있는지 확인
        const { data: existingUser, error: dbError } = await supabase
          .from('users')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (dbError) {
          console.error('❌ 사용자 정보 조회 에러:', dbError.message);
          setError('사용자 정보 확인 중 오류가 발생했습니다.');
          setIsLoading(false);
          return;
        }
        
        if (existingUser) {
          console.log('🏠 이미 등록된 사용자, 메인으로 이동');
          setError('이미 추가 정보가 등록되어 있습니다. 메인 페이지로 이동합니다.');
          setTimeout(() => {
            router.replace('/');
          }, 2000);
          return;
        }
        
        setIsLoading(false);
      } catch (err: any) {
        console.error('💥 인증 확인 예외:', err?.message || err);
        setError('오류가 발생했습니다: ' + (err?.message || '알 수 없는 오류'));
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  // 추가 정보 저장
  const handleSave = async () => {
    try {
      if (!nickname || !age || !region || !userId) {
        setError('모든 정보를 입력해주세요.');
        return;
      }
      
      const safeAge = Number(age);
      if (isNaN(safeAge)) {
        setError('나이는 숫자로 입력해주세요.');
        return;
      }
      
      setIsLoading(true);
      console.log('💾 추가정보 저장 시도:', { nickname, age, region, userId });
      
      const { error: insertError } = await supabase.from('users').insert([{
        user_id: userId,
        username: nickname,
        age: safeAge,
        region,
        email: userEmail || '',
      }]);
      
      if (insertError) {
        console.error('❌ DB 저장 실패:', insertError.message, insertError.code, insertError.details);
        setError('저장 실패: ' + insertError.message);
        setIsLoading(false);
        return;
      }
      
      console.log('✅ 사용자 정보 저장 성공');
      alert('정보가 저장되었습니다!');
      
      // 메인 페이지로 이동
      router.replace('/');
    } catch (err: any) {
      console.error('💥 저장 예외:', err?.message || err);
      setError('저장 중 오류 발생: ' + (err?.message || '알 수 없는 오류'));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">추가 정보 입력</h1>
        
        {isLoading ? (
          <div className="text-center py-4">
            <div className="mb-2">처리 중...</div>
            <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded mb-4">
            {error}
          </div>
        ) : (
          <>
            <p className="text-center text-gray-600 mb-4">회원가입을 완료하려면 추가 정보를 입력해주세요</p>
            <div className="mb-1 text-xs text-gray-500">이메일: {userEmail}</div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
              <input
                type="text"
                placeholder="닉네임"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">나이</label>
              <input
                type="number"
                placeholder="나이"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">지역</label>
              <input
                type="text"
                placeholder="사는 지역"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <button
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            >
              정보 저장
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mb-2">페이지 로딩 중...</div>
          <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
} 