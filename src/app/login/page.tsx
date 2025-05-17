'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  // true: 로그인 폼, false: 추가정보 폼, null: 로딩 중
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [region, setRegion] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 로그인 후 #access_token 해시 있으면 처리
  useEffect(() => {
    console.log('🔄 첫 번째 useEffect 실행 (액세스 토큰 확인)');
    if (
      typeof window !== 'undefined' &&
      window.location.hash.startsWith('#access_token=')
    ) {
      console.log('🔑 소셜 로그인 성공: 액세스 토큰 확인됨');
      // URL에서 해시 제거 (새로고침 방지)
      window.history.replaceState(null, '', window.location.pathname);
      
      // localStorage에 로그인 진행 중 표시
      localStorage.setItem('auth_in_progress', 'true');
      
      // 유저 정보 확인 (약간의 지연을 두어 인증 정보가 완전히 처리되도록)
      setTimeout(() => {
        checkUser();
      }, 1000);
    }
  }, []);

  // 소셜로그인 성공 후 추가 정보 필요 여부 확인
  const checkUser = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 사용자 정보 확인 중...');
      
      // 현재 유저 정보 가져오기 (auth.users)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('❌ getUser error:', userError.message);
        localStorage.removeItem('auth_in_progress');
        setIsLoading(false);
        setUserExists(true); // 에러 시 로그인 폼으로
        return;
      }
      if (!user) {
        console.log('⚠️ 유저 정보 없음, 로그인 상태가 아님');
        localStorage.removeItem('auth_in_progress');
        setIsLoading(false);
        setUserExists(true); // 로그인 상태가 아니면 로그인 폼 표시
        return;
      }

      console.log('✅ 로그인된 유저:', user.id, user.email);
      setUserId(user.id);

      // 1. 내가 만든 Users 테이블에 이미 user_id로 레코드 있는지 확인
      const { data: existingUser, error } = await supabase
        .from('Users')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ 사용자 확인 중 Supabase 에러:', error.message);
        alert('사용자 확인 에러: ' + error.message);
        localStorage.removeItem('auth_in_progress');
        setIsLoading(false);
        setUserExists(true); // 에러 시 로그인 폼
        return;
      }

      localStorage.removeItem('auth_in_progress');
      setIsLoading(false);

      // 2. 없으면 입력폼, 있으면 바로 메인
      if (!existingUser) {
        console.log('📝 새 사용자: 추가 정보 입력 필요');
        setUserExists(false); // false면 추가정보 폼 표시
      } else {
        console.log('🏠 기존 사용자: 메인으로 이동');
        setUserExists(true);
        // 지연시켜 상태 업데이트 후 리디렉션
        setTimeout(() => {
          router.replace('/');
        }, 100);
      }
    } catch (err: any) {
      console.error('💥 checkUser 예외:', err?.message || err);
      localStorage.removeItem('auth_in_progress');
      setIsLoading(false);
      setUserExists(true); // 예외 시 로그인 폼
    }
  };

  // 이 useEffect는 그대로 두되, 초기 로딩 시에만 실행되게 dependencies 비움
  useEffect(() => {
    console.log('🔄 두 번째 useEffect 실행 (초기 사용자 확인)');
    checkUser();
  }, []);

  // 소셜 로그인
  const handleLogin = async (provider: 'google' | 'kakao') => {
    try {
      console.log(`🚀 ${provider} 로그인 시도...`);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // 운영/개발에 맞게 도메인 넣기!
          redirectTo: typeof window !== 'undefined'
            ? window.location.origin + '/login'
            : undefined,
        },
      });
      if (error) {
        console.error('❌ 로그인 오류:', error.message);
        alert('로그인 오류: ' + error.message);
      }
    } catch (err: any) {
      console.error('💥 OAuth 예외:', err?.message || err);
      alert('OAuth 예외: ' + (err?.message || err));
    }
  };

  // 추가 정보 저장
  const handleSave = async () => {
    try {
      console.log('💾 추가정보 저장 시도:', { nickname, age, region, userId });
      
      if (!nickname || !age || !region || !userId) {
        console.log('⚠️ 필수 정보 누락');
        alert('모든 정보를 입력해주세요.');
        return;
      }
      const safeAge = Number(age);
      if (isNaN(safeAge)) {
        console.log('⚠️ 나이 형식 오류');
        alert('나이는 숫자여야 합니다.');
        return;
      }

      // 현재 로그인된 유저 이메일도 같이 저장(권장)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('❌ 유저 정보 확인 실패:', userError.message);
        alert('유저 정보 확인 실패: ' + userError.message);
        return;
      }
      
      console.log('📊 삽입할 데이터:', {
        user_id: userId,
        username: nickname,
        age: safeAge,
        region,
        email: user?.email || ''
      });

      const { error } = await supabase.from('Users').insert([{
        user_id: userId,
        username: nickname,
        age: safeAge,
        region,
        email: user?.email || '',
      }]);
      if (error) {
        console.error('❌ DB 저장 실패:', error.message);
        alert('저장 실패: ' + error.message);
      } else {
        console.log('✅ 사용자 정보 저장 성공');
        alert('정보가 저장되었습니다!');
        checkUser();
      }
    } catch (err: any) {
      console.error('💥 저장 예외:', err?.message || err);
      alert('저장 예외: ' + (err?.message || err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">장사템 로그인</h1>
        
        {/* 로딩 상태 표시 */}
        {isLoading && (
          <div className="text-center py-4">
            <div className="mb-2">로딩 중...</div>
            <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
          </div>
        )}
        
        {/* 로그인 버튼 또는 추가 정보 폼 */}
        {!isLoading && (
          <>
            {/* 렌더링 시 상태 로깅 */}
            {(() => { console.log('🔄 렌더링 상태:', { userExists, userId, isLoading }); return null; })()}
            
            {userExists ? (
              <>
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
            ) : (
              <>
                <p className="text-center text-gray-600 mb-4">추가 정보를 입력해주세요</p>
                <div className="mb-1 text-xs text-gray-500">유저ID: {userId}</div>
                <input
                  type="text"
                  placeholder="닉네임"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full mb-3 p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="나이"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full mb-3 p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="사는 지역"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full mb-4 p-2 border rounded"
                />
                <button
                  onClick={handleSave}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
                >
                  정보 저장
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
