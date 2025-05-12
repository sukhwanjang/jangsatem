import WriteClient from './WriteClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMetadata(props: any) {
  const region = decodeURIComponent(props?.params?.region || '자유게시판');
  return {
    title: `글쓰기 - ${region}`,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function WritePage(props: any) {
  const region = decodeURIComponent(props?.params?.region || '자유게시판');
  return <WriteClient region={region} />;
}
