'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [region, setRegion] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/');
    });
  }, [router]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.replace('/');
    } else {
      if (!username || !region || !age) {
        setError('ID, 나이, 지역을 모두 입력해주세요.');
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            region,
            age
          }
        }
      });
      if (error) setError(error.message);
      else {
        alert('회원가입 완료! 장사아이템가득, 장사템입니다!');
        router.replace('/');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          {mode === 'login' ? '로그인' : '회원가입'}
        </h1>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        {mode === 'signup' && (
          <>
            <input
              type="text"
              placeholder="ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 mb-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mb-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="나이"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-4 py-2 mb-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="사는 지역"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-4 py-2 mb-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </>
        )}

        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 mb-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {mode === 'login' && (
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 mb-5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md text-sm transition"
        >
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>

        <div className="mt-6 text-center">
          {mode === 'login' ? (
            <p className="text-sm text-gray-500">
              계정이 없으신가요?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-blue-600 hover:underline"
              >
                회원가입
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              이미 계정이 있으신가요?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-blue-600 hover:underline"
              >
                로그인
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
