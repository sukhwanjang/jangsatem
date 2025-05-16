'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [region, setRegion] = useState('');
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword || !nickname || !age || !region) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!agreeAge || !agreeTerms) {
      alert('모든 약관에 동의해야 가입이 가능합니다.');
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !signUpData.user) {
      alert('회원가입 실패: ' + signUpError?.message);
      return;
    }

    const { error: insertError } = await supabase.from('Users').insert([
      {
        user_id: signUpData.user.id,
        email,
        username: email.split('@')[0],
        nickname,
        age,
        region,
      },
    ]);

    if (insertError) {
      alert('회원가입은 되었지만 사용자 정보 저장 실패: ' + insertError.message);
    }

    alert('회원가입 완료!');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-blue-600 text-center mb-6">회원가입</h1>

        <input
          type="text"
          placeholder="ID"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full border px-4 py-2 mb-3 rounded"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border px-4 py-2 mb-3 rounded"
        />
        <input
          type="password"
          placeholder="비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full border px-4 py-2 mb-3 rounded"
        />
        <input
          type="number"
          placeholder="나이"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="w-full border px-4 py-2 mb-3 rounded"
        />
        <input
          type="text"
          placeholder="사는 지역"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full border px-4 py-2 mb-3 rounded"
        />
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border px-4 py-2 mb-4 rounded"
        />

        <div className="text-sm text-gray-700 mb-4">
          <label className="block mb-1">
            <input
              type="checkbox"
              checked={agreeAge}
              onChange={() => setAgreeAge(!agreeAge)}
              className="mr-2"
            />
            만 14세 이상입니다
          </label>
          <label className="block">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={() => setAgreeTerms(!agreeTerms)}
              className="mr-2"
            />
            장사템 이용약관에 동의합니다
          </label>
        </div>

        <button
          onClick={handleSignup}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-semibold"
        >
          회원가입
        </button>

        <div className="text-sm text-center text-gray-600 mt-4">
          이미 계정이 있으신가요?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            로그인
          </a>
        </div>
      </div>
    </div>
  );
}
