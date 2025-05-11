'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [region, setRegion] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [successMessage, setSuccessMessage] = useState('');
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/');
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
        password: password.trim()
      });
      if (error) {
        setError(error.message);
      } else {
        router.replace('/');
      }
    } else {
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
        setError('필수 동의 항목에 체크해주세요.');
        setLoading(false);
        return;
      }

      // ✅ 이메일 중복 확인
      const { data: existingEmail } = await supabase
        .from('users')
        .select('email')
        .eq('email', email.trim())
        .maybeSingle();

      if (existingEmail) {
        setError('이미 등록된 이메일입니다.');
        setLoading(false);
        return;
      }

      // ✅ ID 중복 확인
      const { data: existingUsername } = await supabase
        .from('users')
        .select('username')
        .eq('username', username.trim())
        .maybeSingle();

      if (existingUsername) {
        setError('이미 사용 중인 ID입니다.');
        setLoading(false);
        return;
      }

      // 🔐 supabase auth 계정 생성
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            username,
            region,
            age
          }
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // ✅ users 테이블 insert
      await supabase.from('users').insert([
        { email: email.trim(), username, region, age }
      ]);

      setSuccessMessage('🎉 회원가입 완료! 장사아이템가득, 장사템입니다!');
      setTimeout(() => router.replace('/'), 2000);
    }

    setLoading(false);
  };

  const allAgreed = agreeAge && agreeTerms;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          {mode === 'login' ? '로그인' : '회원가입'}
        </h1>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        {successMessage && <p className="text-green-600 text-center font-semibold mb-4">{successMessage}</p>}

        {mode === 'signup' && (
          <>
            <input type="text" placeholder="ID" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 mb-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mb-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="password" placeholder="비밀번호 확인" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 mb-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="나이" value={age} onChange={(e) => setAge(e.target.value)}
              className="w-full px-4 py-2 mb-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="text" placeholder="사는 지역" value={region} onChange={(e) => setRegion(e.target.value)}
              className="w-full px-4 py-2 mb-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mb-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="mt-4 border-t pt-4">
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={agreeAge} onChange={() => setAgreeAge(!agreeAge)} />
                <span className="text-sm">[필수] 만 14세 이상입니다</span>
              </label>
              <label className="flex items-center space-x-2 mt-2">
                <input type="checkbox" checked={agreeTerms} onChange={() => setAgreeTerms(!agreeTerms)} />
                <span className="text-sm">[필수] 장사템 이용약관 동의</span>
              </label>
            </div>
          </>
        )}

        {mode === 'login' && (
          <>
            <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mb-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mb-5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || (mode === 'signup' && !allAgreed)}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md text-sm transition ${loading || (mode === 'signup' && !allAgreed) ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '동의하고 가입하기'}
        </button>

        <div className="mt-6 text-center">
          {mode === 'login' ? (
            <p className="text-sm text-gray-500">
              계정이 없으신가요?{' '}
              <button onClick={() => setMode('signup')} className="text-blue-600 hover:underline">회원가입</button>
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              이미 계정이 있으신가요?{' '}
              <button onClick={() => setMode('login')} className="text-blue-600 hover:underline">로그인</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
