import { Metadata } from 'next';
import WriteClient from './WriteClient';

// ✅ generateMetadata – 타입 명시 완전히 제거
// ✅ eslint 경고도 무시
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMetadata({ params }: any): Promise<Metadata> {
  const region = decodeURIComponent(params.region);
  return {
    title: `글쓰기 - ${region}`,
  };
}

// ✅ 페이지 컴포넌트도 동일하게 처리
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function WritePage({ params }: any) {
  const region = decodeURIComponent(params.region);
  return <WriteClient region={region} />;
}
