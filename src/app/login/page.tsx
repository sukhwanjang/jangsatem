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
        password: password.trim(),
      });
      if (error) setError('로그인 실패: ' + error.message);
      else router.replace('/');
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

      const { data: existingUsername } = await supabase
        .from('Users')
        .select('id')
        .eq('username', username.trim())
        .maybeSingle();
      if (existingUsername) {
        setError('이미 사용 중인 ID입니다.');
        setLoading(false);
        return;
      }

      const { data: existingEmail } = await supabase
        .from('Users')
        .select('id')
        .eq('email', email.trim())
        .maybeSingle();
      if (existingEmail) {
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
        { email: email.trim(), username, region, age, user_id },
      ]);

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      setSuccessMessage('🎉 회원가입 완료! 장사아이템가득, 장사템입니다!');
    }

    setLoading(false);
  };

  const allAgreed = agreeAge && agreeTerms;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl relative">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          {mode === 'login' ? '로그인' : '회원가입'}
        </h1>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        {mode === 'signup' && (
          <>
            <input type="text" placeholder="ID" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 mb-3 border rounded-md text-sm" />
            <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 mb-3 border rounded-md text-sm" />
            <input type="password" placeholder="비밀번호 확인" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 mb-3 border rounded-md text-sm" />
            <input type="text" placeholder="나이" value={age} onChange={(e) => setAge(e.target.value)} className="w-full px-4 py-2 mb-3 border rounded-md text-sm" />
            <input type="text" placeholder="사는 지역" value={region} onChange={(e) => setRegion(e.target.value)} className="w-full px-4 py-2 mb-3 border rounded-md text-sm" />
            <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 mb-3 border rounded-md text-sm" />
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
            <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 mb-3 border rounded-md text-sm" />
            <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 mb-5 border rounded-md text-sm" />
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

      {/* ✅ 회원가입 성공 팝업 */}
      {successMessage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-96 text-center">
            <h2 className="text-xl font-bold text-blue-700 mb-3">👋 장사템에 오신 걸 환영합니다!</h2>
            <p className="text-gray-700 text-sm mb-4">
              소상공인의 모든 고민, 여기서 해결하세요. <br />
              간판부터 장비, 시공 인력까지… <br />
              <strong>장사템</strong>과 함께하면 시작이 쉬워집니다.
            </p>
            <button onClick={() => { setSuccessMessage(''); router.replace('/'); }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
