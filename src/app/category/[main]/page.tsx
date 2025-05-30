'use client';

import { useParams } from 'next/navigation';
import HomeClient from '../../homeclient';

export default function MainCategoryPage() {
  const params = useParams();
  const main = decodeURIComponent(params.main as string);

  return (
    <HomeClient initialCategory={main} />
  );
} 