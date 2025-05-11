import { Suspense } from 'react';
import WriteClient from './WriteClient';

interface Props {
  searchParams: { category?: string };
}

export default function WritePage({ searchParams }: Props) {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <WriteClient searchParams={searchParams} />
    </Suspense>
  );
}
