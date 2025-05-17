'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userExists, setUserExists] = useState(true);
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [region, setRegion] = useState('');

  // 로그인 후 해시 리디렉션 방지
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.hash.startsWith('#access_token=')
    ) {
      router.replace('/login'); // 반드시 /login으로 리디렉션
    }
  }, [router]);

  // 소셜 로그인 후 추가 정보 필요 여부 체크
  const checkUser = async () => {
    try {
      // supabase 유저
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        return;
      }
      if (!user) {
        setUserExists(true);
        return;
      }

      setUserId(user.id);

      // Users 테이블에 이미 등록된 사용자 확인 (user_id 기준)
      const { data: existingUser, error } = await supabase
        .from('Users')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        alert('사용자 확인 에러: ' + error.message);
        return;
      }

      if (!existingUser) {
        setUserExists(false); // 추가정보 입력창 띄움
      } else {
        setUserExists(true); // 바로 메인으로
        router.replace('/');
      }
    } catch (err: any) {
      alert('checkUser 에러: ' + (err?.message || err));
    }
  };

  useEffect(() => {
    checkUser();
  }, [router]);

  // 소셜 로그인 실행
  const handleLogin = async (provider: 'google' | 'kakao') => {
    try {
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== 'undefined'
            ? window.location.origin + '/login'
            : undefined,
        },
      });
    } catch (err: any) {
      alert('OAuth 에러: ' + (err?.message || err));
    }
  };

  // 추가 정보 저장
  const handleSave = async () => {
    try {
      if (!nickname || !age || !region || !userId) {
        alert('모든 정보를 입력해주세요.');
        return;
      }
      const safeAge = Number(age);
      if (isNaN(safeAge)) {
        alert('나이는 숫자여야 합니다.');
        return;
      }
      // supabase 유저 정보 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        alert('유저 정보 확인 실패: ' + userError.message);
        return;
      }
      // insert (nickname/username 둘 다 입력)
      const { error } = await supabase.from('Users').insert([{
        user_id: userId,
        username: nickname,
        nickname,
        age: safeAge,
        region,
        email: user?.email || '',
      }]);
      if (error) {
        alert('저장 실패: ' + error.message);
      } else {
        alert('정보가 저장되었습니다!');
        checkUser();
      }
    } catch (err: any) {
      alert('저장 예외: ' + (err?.message || err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">장사템 로그인</h1>
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
      </div>
    </div>
  );
}
