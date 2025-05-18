'use client';

import Image from 'next/image';

interface BannerProps {
  title?: string;
  imageUrl?: string;
}

export default function Banner({ title = "", imageUrl }: BannerProps) {
  return (
    <div className="mb-8">
      <div className="w-full h-52 bg-white border border-gray-200 flex items-center justify-center rounded-lg shadow">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt="배너 이미지"
            width={900}
            height={208}
            className="w-full h-full object-cover rounded-lg"
          />
        )}
      </div>
    </div>
  );
} 