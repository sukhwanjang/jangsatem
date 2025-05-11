import { Suspense } from 'react';
import WriteClient from './WriteClient';

// ✅ 타입 지정하지 말고, 구조 분해 없이 props 통째로 받기
export default function WritePage(props: any) {
  const searchParams = props.searchParams;

  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <WriteClient searchParams={searchParams} />
    </Suspense>
  );
}
