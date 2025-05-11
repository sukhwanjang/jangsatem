import { Suspense } from 'react';
import WriteClient from './WriteClient';

export default function WritePage(
  props: { searchParams?: { category?: string } }
) {
  const { searchParams } = props;

  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <WriteClient searchParams={searchParams} />
    </Suspense>
  );
}
