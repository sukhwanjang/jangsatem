import WriteClient from './WriteClient';

interface Props {
  params: {
    region: string;
  };
}

export default function WritePage({ params }: Props) {
  const region = decodeURIComponent(params.region || '자유게시판');

  return <WriteClient region={region} />;
}
