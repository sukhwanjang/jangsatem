'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const HomeClient = dynamic(() => import('./homeclient'), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <HomeClient />
    </Suspense>
  );
}
