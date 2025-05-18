import { Suspense } from 'react';
import HomeClient from './homeclient';

export default function HomePage() {
  // 서버 컴포넌트가 필요한 경우를 위한 기본 페이지
  // 클라이언트 컴포넌트로 모든 로직 위임
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <HomeClient />
    </Suspense>
  );
}
