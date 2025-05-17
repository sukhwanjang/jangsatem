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
  const [debugMode, setDebugMode] = useState(true); // 디버그 모드 기본 활성화로 변경

  // 로그인 후 #access_token 해시 있으면 처리
  useEffect(() => {
    console.log('🔄 첫 번째 useEffect 실행 (액세스 토큰 확인)');
    
    // 이미 로그인 처리 중인지 확인
    const isAuthInProgress = localStorage.getItem('auth_in_progress') === 'true';
    console.log('🔑 인증 진행 중 상태:', isAuthInProgress);
    
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
        checkUser(true); // 소셜 로그인 완료 후 호출임을 표시
      }, 1500); // 지연 시간 증가
      
      return; // 소셜 로그인 처리 중이면 초기 로딩은 건너뜀
    }
    
    // 이미 로그인 처리 중이면 두 번째 useEffect는 실행하지 않음
    if (!isAuthInProgress) {
      console.log('🔄 초기 사용자 확인 시작');
      checkUser(false);
    } else {
      console.log('⚠️ 이미 인증 진행 중, 초기 로딩 건너뜀');
    }
  }, []);

  // 소셜로그인 성공 후 추가 정보 필요 여부 확인
  const checkUser = async (isAfterSocialLogin = false) => {
    try {
      setIsLoading(true);
      console.log('🔍 사용자 정보 확인 중... (소셜 로그인 후:', isAfterSocialLogin, ')');

      // 디버그 모드에서는 딜레이 추가
      if (debugMode && isAfterSocialLogin) {
        console.log('🐛 디버그 모드: 강제 지연 추가 (5초)');
        await new Promise(r => setTimeout(r, 5000));
      }
      
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
      // 대소문자 주의! 실제 supabase에 생성된 테이블명과 정확히 일치해야 함
      // 확인된 스크린샷에서는 소문자 'users'로 보임
      console.log('🔍 테이블에서 사용자 검색: user_id =', user.id);
      const { data: existingUser, error } = await supabase
        .from('users') // 소문자로 변경 - 실제 테이블명과 일치하게
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ 사용자 확인 중 Supabase 에러:', error.message, error.code, error.details);
        
        // 테이블 존재 여부 확인 시도 (public 스키마만 가능)
        try {
          const { data: tablesData, error: tablesError } = await supabase
            .rpc('get_tables');
          if (!tablesError) {
            console.log('📋 사용 가능한 테이블:', tablesData);
          }
        } catch (e) {
          console.error('테이블 목록 조회 실패:', e);
        }
        
        alert('사용자 확인 에러: ' + error.message);
        localStorage.removeItem('auth_in_progress');
        setIsLoading(false);
        setUserExists(true); // 에러 시 로그인 폼
        return;
      }

      console.log('🔍 사용자 조회 결과:', existingUser);
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

      // users 테이블명 소문자로 수정 (테이블 스크린샷 기준)
      const { error } = await supabase.from('users').insert([{
        user_id: userId,
        username: nickname,
        age: safeAge,
        region,
        email: user?.email || '',
      }]);
      
      if (error) {
        console.error('❌ DB 저장 실패:', error.message, error.code, error.details);
        alert('저장 실패: ' + error.message);
      } else {
        console.log('✅ 사용자 정보 저장 성공');
        alert('정보가 저장되었습니다!');
        
        // 저장 성공 시 메인으로 리디렉션 (checkUser를 다시 호출하지 않고 바로 리디렉션)
        router.replace('/');
      }
    } catch (err: any) {
      console.error('💥 저장 예외:', err?.message || err);
      alert('저장 예외: ' + (err?.message || err));
    }
  };

  // 테이블 목록 조회 기능 추가 (디버그용)
  const checkTables = async () => {
    try {
      console.log('📋 테이블 목록 조회 시도...');
      // public 스키마의 테이블 목록 조회 시도
      const { data, error } = await supabase
        .from('pg_catalog.pg_tables')
        .select('schemaname, tablename')
        .eq('schemaname', 'public');
      
      if (error) {
        console.error('❌ 테이블 목록 조회 실패:', error);
        return;
      }
      
      console.log('📋 테이블 목록:', data);
      alert('콘솔에서 테이블 목록을 확인하세요.');
    } catch (err) {
      console.error('💥 테이블 조회 예외:', err);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow relative">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">장사템 로그인</h1>
        
        {/* 디버그 토글 */}
        <div className="absolute top-2 right-2 flex items-center text-xs">
          <label className="flex items-center cursor-pointer mr-1">
            <input
              type="checkbox"
              checked={debugMode}
              onChange={() => setDebugMode(!debugMode)}
              className="mr-1"
            />
            디버그모드
          </label>
          {debugMode && (
            <div className="bg-yellow-100 px-2 py-1 rounded text-xs">
              상태: {userExists === null ? '로딩중' : userExists ? '로그인폼' : '추가정보폼'}
            </div>
          )}
        </div>
        
        {/* 로딩 상태 표시 */}
        {isLoading && (
          <div className="text-center py-4">
            <div className="mb-2">로딩 중...</div>
            <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
          </div>
        )}
        
        {/* 디버그 정보 */}
        {debugMode && !isLoading && (
          <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
            <div>userId: {userId || '없음'}</div>
            <div>userExists: {String(userExists)}</div>
            <div>auth_in_progress: {localStorage.getItem('auth_in_progress') || '없음'}</div>
            <button
              onClick={checkTables}
              className="mt-1 px-2 py-0.5 bg-blue-100 rounded text-xs"
            >
              테이블 목록 조회
            </button>
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
