"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Props {
  region: string;
}

export default function WriteClient({ region }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

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
        <label className="block font-bold text-sm text-gray-700 mb-2">말머리</label>
        <div className="flex gap-2">
          {["수다", "팁/정보", "질문", "소갯/자랑", "게임뉴스"].map((label, idx) => (
            <button
              key={idx}
              className={`px-4 py-1 rounded-md text-sm border ${
                label === "수다" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
              }`}
              disabled={label !== "수다"}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 제목 */}
      <div className="mb-6">
        <label className="block font-bold text-sm text-gray-700 mb-2">제목입력 *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력해주세요"
          className="w-full px-4 py-2 border rounded-md text-sm"
        />
      </div>

      {/* 내용 */}
      <div className="mb-6">
        <label className="block font-bold text-sm text-gray-700 mb-2">내용입력 *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="여기에 내용을 입력하세요."
          className="w-full h-60 px-4 py-2 border rounded-md text-sm resize-none"
        />
      </div>

      {/* 이미지 업로드 */}
      <div className="mb-6">
        <input type="file" accept="image/*" onChange={handleImageChange} />
      </div>

      {/* 안내문 */}
      <div className="text-xs text-gray-500 leading-6 mb-6 border-t pt-4">
        * 이미지 파일은 각 파일 최대 20MB, 총 50개까지 업로드 가능합니다.<br />
        * 동영상은 MP4, AVI 등의 형식으로 개당 50MB, 3개까지 업로드 가능합니다.<br />
        * 개인정보 침해, 저작권 침해, 명예훼손, 청소년 유해 매체, 불법 유해 정보 게시할 경우 삭제, 차단되며 관련 법률 및 운영 원칙에 따라 제재를 받을 수 있습니다.
      </div>

      {/* 등록 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full py-2 rounded text-white text-lg font-semibold ${
          loading ? "bg-gray-400" : "bg-blue-400 hover:bg-blue-500"
        }`}
      >
        {loading ? "업로드 중..." : "등록하기"}
      </button>
    </div>
  );
}
