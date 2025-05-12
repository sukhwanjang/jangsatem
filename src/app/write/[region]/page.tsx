import { Metadata } from 'next';
import WriteClient from './WriteClient';

// ✅ 타입 any로 유지 + decodeURIComponent 적용
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMetadata({ params }: any): Promise<Metadata> {
  const region = decodeURIComponent(params.region);
  return {
    title: `글쓰기 - ${region}`,
  };
}

// ✅ props에서 region 제대로 파싱해서 WriteClient에 넘김
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function WritePage({ params }: any) {
  const region = decodeURIComponent(params.region); // ✅ 여기가 핵심
  return <WriteClient region={region} />;
}
