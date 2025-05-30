"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { categoryData, extraBoards } from "@/lib/categoryData";
import dynamic from 'next/dynamic';

// 컴포넌트 타입 정의
interface TiptapEditorProps {
  content: string;
  onChange: (newContent: string) => void;
}

// Tiptap 에디터를 동적으로 가져오기 (절대 경로 사용)
const TiptapEditor = dynamic<TiptapEditorProps>(() => import('@/app/write/[region]/TiptapEditor'), { 
  ssr: false,
  loading: () => <div className="w-full h-60 flex items-center justify-center bg-gray-50">에디터 로딩 중...</div>
});

interface Props {
  region: string;
}

export default function WriteClient({ region }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedHeader, setSelectedHeader] = useState("수다");
  const [editorLoaded, setEditorLoaded] = useState(false);
  
  // 현재 지역에 맞는 말머리 옵션 구하기
  const [headers, setHeaders] = useState<string[]>(["수다", "팁/정보", "질문", "소갯/자랑", "게임뉴스"]);
  
  useEffect(() => {
    // 에디터가 클라이언트 사이드에서 로드됨을 표시
    setEditorLoaded(true);
    
    // region이 'extraBoards'에 있는 경우 기본 말머리 사용
    // 그렇지 않은 경우 메인 카테고리-서브 카테고리 형태의 region에서 서브 카테고리 추출
    if (!extraBoards.includes(region) && region.includes('-')) {
      const [mainCategory, subCategory] = region.split('-');
      const group = categoryData.find(g => g.group === mainCategory);
      if (group) {
        setHeaders(group.items.map(item => item.label));
        if (subCategory && group.items.some(item => item.label === subCategory)) {
          setSelectedHeader(subCategory);
        }
      }
    }
  }, [region]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImage(file);
  };

  const handleEditorChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleSubmit = async () => {
    if (!title || !content) return alert("제목과 내용을 입력해주세요.");
    setLoading(true);

    let imageUrl = null;
    if (image) {
      const { data, error } = await supabase.storage
        .from("uploads")
        .upload(`posts/${Date.now()}-${image.name}`, image);

      if (error) {
        alert("이미지 업로드 실패");
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(data.path);
      imageUrl = urlData.publicUrl;
    }

    const { error: insertError } = await supabase.from("posts").insert([
      {
        title,
        content,
        region,
        image_url: imageUrl,
      },
    ]);

    if (insertError) {
      alert("글 등록 실패: " + insertError.message);
    } else {
      alert("등록 완료!");
      router.push("/");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-10 rounded-xl shadow-md mt-10">
      {/* ✅ 목록으로 버튼 추가 */}
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm text-blue-600 hover:underline"
      >
        ← 목록으로
      </button>

      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">✏️ 글쓰기 - {region}</h1>

      {/* 말머리 선택 */}
      <div className="mb-6">
        <label className="block font-bold text-sm text-gray-700 mb-2">말머리 <span className="text-red-500">*</span></label>
        <div className="flex flex-wrap gap-2">
          {headers.map((header, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedHeader(header)}
              className={`px-4 py-1.5 rounded-md text-sm border transition-colors ${
                header === selectedHeader 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {header}
            </button>
          ))}
        </div>
      </div>

      {/* 제목 */}
      <div className="mb-6">
        <label className="block font-bold text-sm text-gray-700 mb-2">제목입력 <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력해주세요"
          className="w-full px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
        />
      </div>

      {/* 내용 - Tiptap 에디터로 교체 */}
      <div className="mb-6">
        <label className="block font-bold text-sm text-gray-700 mb-2">내용입력 <span className="text-red-500">*</span></label>
        
        {editorLoaded && (
          <TiptapEditor
            content={content}
            onChange={handleEditorChange}
          />
        )}
      </div>

      {/* 이미지 업로드 */}
      <div className="mb-6">
        <label className="block font-bold text-sm text-gray-700 mb-2">이미지 첨부</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageChange}
          className="w-full text-sm border p-2 rounded"
        />
      </div>

      {/* 안내문 */}
      <div className="text-xs text-gray-500 leading-6 mb-6 border-t pt-4">
        <p className="mb-1"><span className="text-red-500">*</span> 이미지 파일은 각 파일 최대 20MB, 총 50개까지 업로드 가능합니다.</p>
        <p className="mb-1"><span className="text-red-500">*</span> 동영상은 MP4, AVI등의 형식으로 개당 50MB, 3개까지 업로드 가능합니다.</p>
        <p><span className="text-red-500">*</span> 개인정보 침해, 저작권 침해, 명예훼손, 청소년 유해 매체, 불법 유해 정보 등을 게시할 경우 삭제, 차단되며 관련 법률 및 운영 원칙에 따라 제재를 받을 수 있습니다.</p>
      </div>

      {/* 등록 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full py-3 rounded-lg text-white text-base font-semibold transition-colors ${
          loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {loading ? "업로드 중..." : "등록하기"}
      </button>
    </div>
  );
}
