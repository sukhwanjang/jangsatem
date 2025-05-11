import { Suspense } from 'react';
import WriteClient from './WriteClient';

export default async function WritePage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <WriteClient searchParams={searchParams} />
    </Suspense>
  );
}
