import { Suspense } from 'react';
import WriteClient from './WriteClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function WritePage(props: any) {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <WriteClient searchParams={props.searchParams} />
    </Suspense>
  );
}
