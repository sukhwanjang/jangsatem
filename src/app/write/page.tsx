import { Suspense } from 'react';
import WriteClient from './WriteClient';

// ✅ Next.js가 기대하는 구조에 맞춘 타입 선언
export default function WritePage({
  searchParams,
}: {
  // 🔥 이 타입이 핵심: 구조는 객체지만 Promise가 아님
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <WriteClient searchParams={searchParams} />
    </Suspense>
  );
}
