'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [region, setRegion] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/');
    });
  }, [router]);

  const handleMagicLink = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!email) {
      setError('이메일을 입력해주세요.');
      setLoading(false);
      return;
    }

    if (mode === 'signup' && (!username || !region || !age)) {
      setError('모든 항목을 입력해주세요.');
      setLoading(false);
      return;
    }

    // 이메일 중복 검사
    const { data: existingUser } = await supabase
      .from('Users')
      .select('id')
      .eq('email', email.trim())
      .maybeSingle();

    if (mode === 'signup' && existingUser) {
      setError('이미 가입된 이메일입니다.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
    });

    if (error) {
      setError(error.message);
    } else {
      if (mode === 'signup') {
        setSuccessMessage('인증 메일을 전송했어요! 메일을 확인해주세요.');
        localStorage.setItem('pending_user_info', JSON.stringify({ email, username, region, age }));
      } else {
        setSuccessMessage('로그인 링크가 이메일로 전송되었습니다.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          {mode === 'login' ? '로그인' : '회원가입'} (Magic Link)
        </h1>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        {successMessage && <p className="text-green-600 text-center font-semibold mb-4">{successMessage}</p>}

        {mode === 'signup' && (
          <>
            <input type="text" placeholder="ID" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 mb-3 border rounded-md text-sm" />
            <input type="text" placeholder="나이" value={age} onChange={(e) => setAge(e.target.value)} className="w-full px-4 py-2 mb-3 border rounded-md text-sm" />
            <input type="text" placeholder="사는 지역" value={region} onChange={(e) => setRegion(e.target.value)} className="w-full px-4 py-2 mb-3 border rounded-md text-sm" />
          </>
        )}

        <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 mb-3 border rounded-md text-sm" />

        <button onClick={handleMagicLink} disabled={loading} className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md text-sm transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {loading ? '처리 중...' : mode === 'login' ? '로그인 링크 보내기' : '가입 링크 보내기'}
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
