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
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

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
        setDebugInfo(prev => ({...prev, user: { id: user.id, email: user.email }}));
        
        // 테이블 정보 확인 시도
        try {
          const { data: tables } = await supabase.rpc('get_tables');
          setDebugInfo(prev => ({...prev, tables}));
          console.log('📊 테이블 목록:', tables);
        } catch (e) {
          console.log('테이블 목록 조회 실패');
        }
        
        // 이미 추가 정보가 등록되어 있는지 확인 - 소문자 테이블 먼저 시도
        const { data: existingUser, error: dbError } = await supabase
          .from('users')
          .select('id, username, user_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        console.log('📝 users 테이블 조회 결과:', existingUser, dbError);
        setDebugInfo(prev => ({...prev, usersQuery: { data: existingUser, error: dbError }}));
          
        if (dbError) {
          console.error('❌ users 테이블 조회 에러:', dbError.message);
          
          // 대문자 테이블 시도
          const { data: existingUserCaps, error: dbErrorCaps } = await supabase
            .from('Users')
            .select('id, username, user_id')
            .eq('user_id', user.id)
            .maybeSingle();
            
          console.log('📝 Users 테이블(대문자) 조회 결과:', existingUserCaps, dbErrorCaps);
          setDebugInfo(prev => ({...prev, UsersQuery: { data: existingUserCaps, error: dbErrorCaps }}));
          
          if (dbErrorCaps) {
            setError('사용자 정보 확인 중 오류가 발생했습니다. 테이블을 확인해주세요.');
            setIsLoading(false);
            return;
          }
          
          if (existingUserCaps) {
            setError('이미 추가 정보가 등록되어 있습니다. 메인 페이지로 이동합니다.');
            setTimeout(() => {
              router.replace('/');
            }, 2000);
            return;
          }
          
          // 기존 정보 없음, 계속 진행
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
      setDebugInfo(prev => ({...prev, saveAttempt: { nickname, age, region, userId }}));
      
      // 소문자 테이블에 저장 시도
      const { error: insertError } = await supabase.from('users').insert([{
        user_id: userId,
        username: nickname,
        age: safeAge,
        region,
        email: userEmail || '',
      }]);
      
      // 소문자 테이블 저장 실패하면 대문자 테이블 시도
      if (insertError) {
        console.error('❌ users 테이블 저장 실패:', insertError);
        setDebugInfo(prev => ({...prev, usersInsertError: insertError}));
        
        const { error: insertCapsError } = await supabase.from('Users').insert([{
          user_id: userId,
          username: nickname,
          age: safeAge,
          region,
          email: userEmail || '',
        }]);
        
        if (insertCapsError) {
          console.error('❌ Users 테이블(대문자) 저장 실패:', insertCapsError);
          setDebugInfo(prev => ({...prev, UsersInsertError: insertCapsError}));
          setError('저장 실패: ' + insertCapsError.message);
          setIsLoading(false);
          return;
        }
        
        console.log('✅ 사용자 정보 저장 성공 (대문자 테이블)');
        alert('정보가 저장되었습니다!');
        
        // 메인 페이지로 이동
        router.replace('/');
        return;
      }
      
      console.log('✅ 사용자 정보 저장 성공 (소문자 테이블)');
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
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow relative">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">추가 정보 입력</h1>
        
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
          </div>
        )}
        
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