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

  const checkUser = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('🔴 Auth error:', userError.message);
      return;
    }

    if (!user) {
      console.log('⚠️ No authenticated user found');
      return;
    }

    console.log('✅ Supabase 로그인된 유저:', user);

    setUserId(user.id);

    const { data: existingUser, error } = await supabase
      .from('Users')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('🔴 User check error:', error.message);
      return;
    }

    if (!existingUser) {
      console.log('🟡 신규 유저, 정보 입력 필요');
      setUserExists(false);
    } else {
      console.log('✅ 기존 유저, 홈으로 이동');
      router.replace('/');
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const handleLogin = async (provider: 'google' | 'kakao') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/login`,
      },
    });

    if (error) console.error('🔴 OAuth login error:', error.message);
  };

  const handleSave = async () => {
    if (!nickname || !age || !region || !userId) {
      alert('모든 정보를 입력해주세요.');
      return;
    }

    const numericAge = parseInt(age, 10);
    if (isNaN(numericAge)) {
      alert('나이는 숫자여야 합니다.');
      return;
    }

    const { error } = await supabase.from('Users').insert([
      {
        user_id: userId,
        username: nickname,
        age: numericAge,
        region: region,
      },
    ]);

    if (error) {
      console.error('🔴 Insert error:', error.message);
      alert('정보 저장 실패: ' + error.message);
    } else {
      alert('정보가 저장되었습니다.');
      // ✅ 약간의 지연 후 홈 이동
      setTimeout(() => {
        router.replace('/');
      }, 500);
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
