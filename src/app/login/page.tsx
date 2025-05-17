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

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        const { data: existingUser, error } = await supabase
          .from('User')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('User check error:', error.message);
        }

        if (!existingUser) {
          setUserExists(false);
        } else {
          router.replace('/');
        }
      }
    };

    checkUser();
  }, [router]);

  const handleLogin = async (provider: 'google' | 'kakao') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/login`,
      },
    });
    if (error) console.error('OAuth error:', error.message);
  };

  const handleSave = async () => {
    if (!nickname || !age || !region || !userId) {
      alert('모든 정보를 입력해주세요.');
      return;
    }

    const { error } = await supabase.from('User').insert([
      {
        user_id: userId,
        username: nickname,
        age: parseInt(age),
        region: region,
      },
    ]);

    if (error) {
      console.error('Insert error:', error.message);
      alert('저장 실패: ' + error.message);
    } else {
      alert('정보가 저장되었습니다.');
      router.replace('/');
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
