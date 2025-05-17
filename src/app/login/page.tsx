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

  // 세션 복구 또는 유저 확인
  const checkUser = async () => {
    try {
      // 세션 수동 복구 시도
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ getSession error:', sessionError.message);
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('❌ getUser error:', userError.message);
        return;
      }

      if (!user) {
        console.warn('⚠️ 유저 없음 (비로그인 상태)');
        return;
      }

      setUserId(user.id);

      // 반드시 대소문자 정확히(Users)
      const { data: existingUser, error } = await supabase
        .from('Users')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ 사용자 확인 중 Supabase 에러:', error.message);
        alert('사용자 확인 에러: ' + error.message);
        return;
      }

      if (!existingUser) {
        setUserExists(false);
      } else {
        setUserExists(true);
        router.replace('/');
      }
    } catch (err) {
      console.error('💥 checkUser 실행 중 예외 발생:', (err as any)?.message || err);
      alert('checkUser 에러: ' + ((err as any)?.message || err));
    }
  };

  useEffect(() => {
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleLogin = async (provider: 'google' | 'kakao') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${location.origin}/login`,
        },
      });

      if (error) {
        console.error('❌ OAuth 로그인 오류:', error.message);
        alert('로그인 오류: ' + error.message);
      }
    } catch (err: any) {
      console.error('💥 handleLogin 예외:', err?.message || err);
      alert('OAuth 에러: ' + (err?.message || err));
    }
  };

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

      // 로그인된 유저 정보(email 포함) 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        alert('유저 정보 확인 실패: ' + userError.message);
        return;
      }

      const { error } = await supabase.from('Users').insert([
        {
          user_id: userId,
          username: nickname,
          age: safeAge,
          region,
          email: user?.email || '',  // ← 여기서 자동 저장!
        },
      ]);

      if (error) {
        console.error('❌ 정보 저장 실패:', error.message, error.details || '', error.hint || '');
        alert('저장 실패: ' + error.message + (error.details ? '\n' + error.details : '') + (error.hint ? '\n' + error.hint : ''));
      } else {
        alert('정보가 저장되었습니다.');
        checkUser();
      }
    } catch (err: any) {
      console.error('💥 handleSave 예외:', err?.message || err);
      alert('정보 저장 예외: ' + (err?.message || err));
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
