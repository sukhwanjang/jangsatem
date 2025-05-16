'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password || !nickname) {
      alert('이메일, 비밀번호, 닉네임을 모두 입력해주세요.');
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !signUpData.user) {
      console.error('회원가입 실패:', signUpError);
      alert('회원가입 실패');
      return;
    }

    const { error: insertError } = await supabase.from('Users').insert([
      {
        user_id: signUpData.user.id,
        email,
        username: email.split('@')[0],
        nickname,
      },
    ]);

    if (insertError) {
      console.error('닉네임 저장 실패:', insertError);
      alert('회원가입은 되었지만 닉네임 저장 실패');
      return;
    }

    alert('회원가입 성공!');
    router.push('/login'); // 로그인 페이지로 이동
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">회원가입</h1>

      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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
        type="text"
        placeholder="닉네임"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        className="w-full border px-4 py-2 mb-4 rounded"
      />
      <button
        onClick={handleSignup}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
      >
        가입하기
      </button>
    </div>
  );
}
