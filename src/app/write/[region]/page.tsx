// ✅ src/app/write/[region]/page.tsx
import { Metadata } from 'next';
import WriteClient from './WriteClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMetadata({ params }: any): Promise<Metadata> {
  const region = decodeURIComponent(params.region);
  return {
    title: `글쓰기 - ${region}`,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function WritePage({ params }: any) {
  const region = decodeURIComponent(params.region);
  return <WriteClient region={region} />;
}
