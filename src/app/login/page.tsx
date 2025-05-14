'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [region, setRegion] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // 로그인된 유저가 있으면 홈으로 리디렉션
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace('/');
      }
    });
  }, [router]);

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      if (error) {
        setError('로그인 실패: ' + error.message);
      } else {
        router.replace('/');
      }
      setLoading(false);
      return;
    }

    // 회원가입일 경우
    if (!username || !region || !age || !email || !password || !confirmPassword) {
      setError('모든 항목을 입력해주세요.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }
    if (!agreeAge || !agreeTerms) {
      setError('필수 항목에 동의해주세요.');
      setLoading(false);
      return;
    }

    const { data: userCheck } = await supabase
      .from('Users')
      .select('id')
      .eq('username', username.trim())
      .maybeSingle();

    if (userCheck) {
      setError('이미 사용 중인 ID입니다.');
      setLoading(false);
      return;
    }

    const { data: emailCheck } = await supabase
      .from('Users')
      .select('id')
      .eq('email', email.trim())
      .maybeSingle();

    if (emailCheck) {
      setError('이미 사용 중인 이메일입니다.');
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
    });

    if (signUpError) {
      setError('회원가입 실패: ' + signUpError.message);
      setLoading(false);
      return;
    }

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (loginError || !loginData.user) {
      setError('로그인 세션 확인 실패');
      setLoading(false);
      return;
    }

    const user_id = loginData.user.id;

    const { error: insertError } = await supabase.from('Users').insert([
      {
        email: email.trim(),
        username,
        region,
        age,
        user_id,
      },
    ]);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSuccessMessage('🎉 장사템 방문을 환영합니다!');
    setLoading(false);
  };

  const handleConfirm = () => {
    setSuccessMessage('');
    router.replace('/');
  };

  const allAgreed = agreeAge && agreeTerms;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          {mode === 'login' ? '로그인' : '회원가입'}
        </h1>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        {mode === 'signup' && (
          <>
            <input
              type="text"
              placeholder="ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mb-3 p-2 border rounded text-sm"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-3 p-2 border rounded text-sm"
            />
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full mb-3 p-2 border rounded text-sm"
            />
            <input
              type="text"
              placeholder="나이"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full mb-3 p-2 border rounded text-sm"
            />
            <input
              type="text"
              placeholder="사는 지역"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full mb-3 p-2 border rounded text-sm"
            />
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-3 p-2 border rounded text-sm"
            />
            <div className="mt-4 text-sm text-gray-700 space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={agreeAge}
                  onChange={() => setAgreeAge(!agreeAge)}
                  className="mr-2"
                />
                만 14세 이상입니다
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={() => setAgreeTerms(!agreeTerms)}
                  className="mr-2"
                />
                장사템 이용약관에 동의합니다
              </label>
            </div>
          </>
        )}

        {mode === 'login' && (
          <>
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-3 p-2 border rounded text-sm"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-5 p-2 border rounded text-sm"
            />
          </>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || (mode === 'signup' && !allAgreed)}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded text-sm transition ${
            loading || (mode === 'signup' && !allAgreed)
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
        >
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>

        <div className="text-center mt-4 text-sm text-gray-600">
          {mode === 'login' ? (
            <>
              계정이 없으신가요?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-blue-600 hover:underline"
              >
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-blue-600 hover:underline"
              >
                로그인
              </button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {successMessage && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-lg text-center shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <p className="text-lg font-semibold text-blue-700 mb-4">{successMessage}</p>
              <button
                onClick={handleConfirm}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                확인
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
