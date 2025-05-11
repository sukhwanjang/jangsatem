import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const WriteClient = dynamic(() => import('@/app/write/WriteClient'), { ssr: false });

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
