import { Suspense } from 'react';
import WriteClient from './WriteClient';

type PageProps = {
  searchParams?: { category?: string };
};

export default function WritePage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <WriteClient searchParams={searchParams} />
    </Suspense>
  );
}
