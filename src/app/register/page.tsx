'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, clearSession } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [region, setRegion] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  // 페이지 로드 시 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('회원가입 페이지 초기화');
        
        // 로컬 스토리지에서 리디렉션 정보 확인
        const redirectStatus = localStorage.getItem('loginRedirect');
        const storedUserId = localStorage.getItem('auth_user_id');
        const storedEmail = localStorage.getItem('auth_user_email');
        
        console.log('리디렉션 상태:', redirectStatus);
        
        // 테이블 정보 확인
        try {
          const { data: tableInfo, error: tablesError } = await supabase.rpc('get_tables');
          console.log('사용 가능한 테이블:', tableInfo);
          setDebug((prev: any) => ({...prev, tables: tableInfo, tablesError}));
        } catch (e) {
          console.log('테이블 정보 조회 실패:', e);
          setDebug((prev: any) => ({...prev, tableError: e}));
        }
        
        // 로컬 스토리지에 저장된 사용자 정보가 있으면 사용
        if (storedUserId) {
          console.log('저장된 사용자 ID 발견:', storedUserId);
          setUserId(storedUserId);
          if (storedEmail) setUserEmail(storedEmail);
          
          // 새 사용자 등록 모드로 설정
          setIsNewUser(true);
          setIsLoading(false);
          
          // 로컬 스토리지에서 사용 후 삭제
          localStorage.removeItem('auth_user_id');
          localStorage.removeItem('auth_user_email');
          return;
        }
        
        // 세션 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('세션 오류:', sessionError);
          setError('세션 정보를 가져오는 중 오류가 발생했습니다: ' + sessionError.message);
          setDebug((prev: any) => ({...prev, sessionError}));
          setIsLoading(false);
          return;
        }
        
        if (!session) {
          setError('로그인이 필요합니다');
          setIsLoading(false);
          setTimeout(() => router.push('/login'), 1500);
          return;
        }
        
        // 사용자 정보 가져오기
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('사용자 정보 오류:', userError);
          setError('사용자 정보를 가져오는 중 오류가 발생했습니다: ' + userError.message);
          setDebug((prev: any) => ({...prev, userError}));
          setIsLoading(false);
          return;
        }
        
        if (!user) {
          setError('사용자 정보를 찾을 수 없습니다');
          setIsLoading(false);
          setTimeout(() => router.push('/login'), 1500);
          return;
        }
        
        console.log('사용자 정보 확인됨:', user.id);
        setUserId(user.id);
        setUserEmail(user.email || null);
        setDebug((prev: any) => ({...prev, user}));
        
        // 이미 프로필이 있는지 확인 - Users 테이블 확인 (대문자)
        try {
          const { data: profile, error: profileError } = await supabase
            .from('Users')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('프로필 조회 오류:', profileError);
            setError('프로필 정보를 조회하는 중 오류가 발생했습니다: ' + profileError.message);
            setDebug((prev: any) => ({...prev, profileError}));
            
            // 테이블이 없는 경우 새 사용자로 간주
            if (profileError.code === 'PGRST116' || 
                profileError.message.includes('does not exist')) {
              console.log('테이블이 없습니다. 새 사용자로 등록합니다.');
              setIsNewUser(true);
              setIsLoading(false);
              return;
            }
            
            setIsLoading(false);
            return;
          }
          
          if (profile) {
            // 로컬 스토리지가 없고, 이미 프로필이 있는 경우
            if (redirectStatus !== 'register') {
              console.log('이미 회원가입 완료된 사용자');
              setError('이미 추가 정보가 등록되어 있습니다');
              setTimeout(() => router.push('/'), 1500);
              return;
            }
          }
          
          // 프로필이 없으면 새 사용자로 등록
          setIsNewUser(true);
        } catch (err) {
          console.error('프로필 확인 예외:', err);
          setError('프로필 확인 중 오류가 발생했습니다');
          setDebug((prev: any) => ({...prev, profileCheckError: err}));
          // 오류가 발생해도 폼은 표시
          setIsNewUser(true);
        }
        
        setIsLoading(false);
        
        // 리디렉션 정보 제거
        localStorage.removeItem('loginRedirect');
      } catch (err: any) {
        console.error('인증 확인 오류:', err.message);
        setError('인증 확인 중 오류가 발생했습니다: ' + err.message);
        setDebug((prev: any) => ({...prev, authCheckError: err}));
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  // 폼 제출 처리
  const handleSubmit = async () => {
    try {
      // 입력값 검증
      if (!username || !age || !region || !nickname) {
        setError('모든 항목을 입력해주세요');
        return;
      }
      
      const safeAge = parseInt(age);
      if (isNaN(safeAge)) {
        setError('나이는 숫자로 입력해주세요');
        return;
      }
      
      if (!userId) {
        setError('사용자 정보를 찾을 수 없습니다');
        return;
      }
      
      setIsLoading(true);
      console.log('프로필 정보 저장 시도');
      
      // 현재 시간
      const now = new Date().toISOString();
      
      const userData = {
        user_id: userId,
        username: username,
        email: userEmail || '',
        age: safeAge,
        region: region,
        nickname: nickname,
        created_at: now,
        updated_at: now,
        role: 'user',
        status: 'active'
      };
      
      console.log('저장할 데이터:', userData);
      setDebug((prev: any) => ({...prev, saveData: userData}));
      
      // 프로필 정보 저장 - Users 테이블에 맞게 데이터 구성
      const { error: saveError } = await supabase
        .from('Users')
        .insert([userData]);
        
      if (saveError) {
        console.error('저장 오류:', saveError);
        setError('정보 저장 중 오류가 발생했습니다: ' + saveError.message);
        setDebug((prev: any) => ({...prev, saveError}));
        
        // 다른 테이블 이름으로 시도해볼 수 있음
        if (saveError.code === 'PGRST116' || 
            saveError.message.includes('does not exist')) {
          
          console.log('Users 테이블이 없습니다. users(소문자) 테이블로 시도합니다.');
          
          // 소문자 테이블로 시도
          const { error: lowerCaseError } = await supabase
            .from('users')
            .insert([userData]);
            
          if (lowerCaseError) {
            console.error('소문자 테이블 저장 오류:', lowerCaseError);
            setDebug((prev: any) => ({...prev, lowerCaseError}));
            setIsLoading(false);
            return;
          } else {
            // 저장 성공
            console.log('소문자 테이블에 저장 성공');
            alert('추가 정보가 저장되었습니다! 환영합니다 🎉');
            router.push('/');
            return;
          }
        }
        
        setIsLoading(false);
        return;
      }
      
      console.log('회원가입 완료');
      alert('추가 정보가 저장되었습니다! 환영합니다 🎉');
      router.push('/');
    } catch (err: any) {
      console.error('저장 실패:', err.message);
      setError('처리 중 오류가 발생했습니다: ' + err.message);
      setDebug((prev: any) => ({...prev, submitError: err}));
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
            <pre>{JSON.stringify(debug, null, 2)}</pre>
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center py-4">
            <div className="mb-2">처리 중...</div>
            <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : error && !isNewUser ? (
          <div className="p-4 bg-red-50 text-red-600 rounded mb-4">
            <div className="mb-2">{error}</div>
            
            <button 
              onClick={() => setIsNewUser(true)}
              className="w-full mt-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm py-1 rounded"
            >
              그래도 입력폼 표시하기
            </button>
            
            {/* 오류 상세 정보 */}
            {debug && (
              <div className="mt-3 text-xs border-t border-red-200 pt-2">
                <details>
                  <summary className="cursor-pointer">오류 상세 정보</summary>
                  <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(debug, null, 2)}</pre>
                </details>
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="text-center text-gray-600 mb-4">회원가입을 완료하려면 추가 정보를 입력해주세요</p>
            <div className="mb-1 text-xs text-gray-500">
              {userEmail ? `이메일: ${userEmail}` : '소셜 계정으로 로그인됨'}
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">아이디(username)</label>
              <input
                type="text"
                placeholder="사용할 아이디"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            
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
              onClick={handleSubmit}
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