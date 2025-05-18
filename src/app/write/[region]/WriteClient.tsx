"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { categoryData, extraBoards } from "@/lib/categoryData";

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
  
  // 현재 지역에 맞는 말머리 옵션 구하기
  const [headers, setHeaders] = useState<string[]>(["수다", "팁/정보", "질문", "소갯/자랑", "게임뉴스"]);
  
  useEffect(() => {
    // region이 'extraBoards'에 있는 경우 기본 말머리 사용
    // 그렇지 않은 경우 메인 카테고리-서브 카테고리 형태의 region에서 서브 카테고리 추출
    if (!extraBoards.includes(region) && region.includes('-')) {
      const [mainCategory, subCategory] = region.split('-');
      if (categoryData[mainCategory]) {
        // 현재 카테고리의 서브카테고리 목록 가져오기
        setHeaders(categoryData[mainCategory]);
        // 현재 선택된 서브카테고리를 기본값으로 설정
        if (subCategory && categoryData[mainCategory].includes(subCategory)) {
          setSelectedHeader(subCategory);
        }
      }
    }
  }, [region]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImage(file);
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

      {/* 내용 */}
      <div className="mb-6">
        <label className="block font-bold text-sm text-gray-700 mb-2">내용입력 <span className="text-red-500">*</span></label>
        
        {/* 편집기 도구 모음 */}
        <div className="border border-b-0 rounded-t-md bg-gray-50 p-2 flex flex-wrap items-center gap-1">
          {/* 이모티콘 버튼 */}
          <button className="p-1.5 rounded hover:bg-gray-200">
            <span role="img" aria-label="이모티콘">😀</span>
          </button>
          
          {/* 이미지 버튼 */}
          <button className="p-1.5 rounded hover:bg-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </button>
          
          {/* 비디오 버튼 */}
          <button className="p-1.5 rounded hover:bg-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </button>
          
          {/* 링크 버튼 */}
          <button className="p-1.5 rounded hover:bg-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </button>
          
          {/* 구분선 */}
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          
          {/* 인용 버튼 */}
          <button className="p-1.5 rounded hover:bg-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </button>
          
          {/* 텍스트 스타일 버튼들 */}
          <button className="p-1.5 rounded hover:bg-gray-200 font-bold">B</button>
          <button className="p-1.5 rounded hover:bg-gray-200 italic">I</button>
          <button className="p-1.5 rounded hover:bg-gray-200 underline">U</button>
          <button className="p-1.5 rounded hover:bg-gray-200 line-through">S</button>
          
          {/* 글자 크기 선택 */}
          <select className="text-sm border rounded p-1 bg-white">
            <option>12px</option>
            <option>14px</option>
            <option>16px</option>
            <option>18px</option>
          </select>
          
          {/* 글꼴 선택 */}
          <select className="text-sm border rounded p-1 bg-white">
            <option>굴림체</option>
            <option>맑은 고딕</option>
            <option>돋움체</option>
          </select>
          
          {/* 정렬 버튼들 */}
          <div className="flex gap-1 ml-1">
            <button className="p-1.5 rounded hover:bg-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-4 h-4" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M2 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
              </svg>
            </button>
            <button className="p-1.5 rounded hover:bg-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-4 h-4" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M4 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
              </svg>
            </button>
            <button className="p-1.5 rounded hover:bg-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-4 h-4" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="여기에 내용을 입력하세요."
          className="w-full h-60 px-4 py-3 border rounded-b-md text-sm resize-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
        />
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
