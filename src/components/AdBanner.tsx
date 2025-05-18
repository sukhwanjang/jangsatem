'use client';

import Image from 'next/image';

interface AdBannerProps {
  title?: string;
  adItems?: {
    id: number;
    title: string;
    imageUrl: string;
    link: string;
  }[];
}

export default function AdBanner({ 
  title = "광고",
  adItems = [
    {
      id: 1,
      title: "단번당 $3.5 받기",
      imageUrl: "https://placehold.co/300x250/2563eb/FFFFFF/png?text=광고+영역",
      link: "#"
    },
    {
      id: 2,
      title: "게임 광고",
      imageUrl: "https://placehold.co/300x250/2563eb/FFFFFF/png?text=게임+광고",
      link: "#"
    }
  ] 
}: AdBannerProps) {
  return (
    <div className="w-64 space-y-6">
      <div className="bg-white rounded-lg border shadow p-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">{title}</h3>
        <div className="space-y-4">
          {adItems.map((ad) => (
            <a 
              key={ad.id} 
              href={ad.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block border rounded-lg hover:shadow-md transition overflow-hidden"
            >
              <div className="relative bg-gray-100 rounded">
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  width={300}
                  height={250}
                  className="w-full h-auto"
                />
              </div>
              <div className="p-2 text-center bg-gray-800 text-white text-sm">
                {ad.title}
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow p-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">인기 게시글</h3>
        <ul className="space-y-2 text-sm">
          <li className="border-b pb-2 last:border-b-0 last:pb-0 hover:text-blue-600">
            <a href="#">간판 추천 부탁드립니다!</a>
          </li>
          <li className="border-b pb-2 last:border-b-0 last:pb-0 hover:text-blue-600">
            <a href="#">신규 창업 준비 중인데 도움 주세요</a>
          </li>
          <li className="border-b pb-2 last:border-b-0 last:pb-0 hover:text-blue-600">
            <a href="#">전기 설비 업체 추천 부탁드립니다</a>
          </li>
          <li className="border-b pb-2 last:border-b-0 last:pb-0 hover:text-blue-600">
            <a href="#">프렌차이즈 창업 고민중입니다</a>
          </li>
          <li className="border-b pb-2 last:border-b-0 last:pb-0 hover:text-blue-600">
            <a href="#">철거 업체 비용 얼마인가요?</a>
          </li>
        </ul>
      </div>
    </div>
  );
} 