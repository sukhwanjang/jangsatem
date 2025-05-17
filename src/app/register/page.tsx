'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, clearSession } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [region, setRegion] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // 페이지 로드 시 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('회원가입 페이지 초기화');
        
        // 세션 확인
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError('로그인이 필요합니다');
          setIsLoading(false);
          setTimeout(() => router.push('/login'), 1500);
          return;
        }
        
        // 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('사용자 정보를 찾을 수 없습니다');
          setIsLoading(false);
          setTimeout(() => router.push('/login'), 1500);
          return;
        }
        
        console.log('사용자 정보 확인됨:', user.id);
        setUserId(user.id);
        setUserEmail(user.email || null);
        
        // 이미 프로필이 있는지 확인
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (profile) {
          console.log('이미 회원가입 완료된 사용자');
          setError('이미 추가 정보가 등록되어 있습니다');
          setTimeout(() => router.push('/'), 1500);
          return;
        }
        
        setIsLoading(false);
      } catch (err: any) {
        console.error('인증 확인 오류:', err.message);
        setError('인증 확인 중 오류가 발생했습니다');
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  // 폼 제출 처리
  const handleSubmit = async () => {
    try {
      // 입력값 검증
      if (!nickname || !age || !region) {
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
      
      // 프로필 정보 저장
      const { error: saveError } = await supabase
        .from('users')
        .insert([{
          user_id: userId,
          username: nickname,
          age: safeAge,
          region: region,
          email: userEmail || '',
          created_at: new Date().toISOString()
        }]);
        
      if (saveError) {
        console.error('저장 오류:', saveError);
        setError('정보 저장 중 오류가 발생했습니다');
        setIsLoading(false);
        return;
      }
      
      console.log('회원가입 완료');
      alert('추가 정보가 저장되었습니다!');
      router.push('/');
    } catch (err: any) {
      console.error('저장 실패:', err.message);
      setError('처리 중 오류가 발생했습니다');
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