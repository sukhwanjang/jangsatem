'use client';

import { useParams } from 'next/navigation';
import HomeClient from '../../../homeclient';

export default function SubCategoryPage() {
  const params = useParams();
  const main = decodeURIComponent(params.main as string);
  const sub = decodeURIComponent(params.sub as string);

  return (
    <HomeClient initialCategory={main} initialTab={sub} />
  );
} 