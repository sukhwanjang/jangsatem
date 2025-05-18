'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { useState, useEffect } from 'react';

interface TiptapEditorProps {
  content: string;
  onChange: (newContent: string) => void;
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  // 에디터 초기화
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // hydration 에러 방지를 위한 클라이언트 사이드 마운팅 체크
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="border rounded-md w-full h-60 bg-gray-50"></div>;
  }

  const toggleBold = () => {
    editor?.chain().focus().toggleBold().run();
  };

  const toggleItalic = () => {
    editor?.chain().focus().toggleItalic().run();
  };

  const toggleUnderline = () => {
    editor?.chain().focus().toggleUnderline().run();
  };

  const toggleStrike = () => {
    editor?.chain().focus().toggleStrike().run();
  };

  const toggleHeading = (level: 1 | 2 | 3) => {
    editor?.chain().focus().toggleHeading({ level }).run();
  };

  const toggleBulletList = () => {
    editor?.chain().focus().toggleBulletList().run();
  };

  const toggleOrderedList = () => {
    editor?.chain().focus().toggleOrderedList().run();
  };

  const setTextAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
    editor?.chain().focus().setTextAlign(align).run();
  };

  return (
    <div className="border rounded-md">
      {/* 툴바 */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
        {/* 텍스트 스타일 버튼들 */}
        <div className="flex gap-1 mr-2">
          <button
            type="button"
            onClick={toggleBold}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('bold') ? 'bg-gray-200' : ''}`}
          >
            <span className="font-bold">B</span>
          </button>
          <button
            type="button"
            onClick={toggleItalic}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
          >
            <span className="italic">I</span>
          </button>
          <button
            type="button"
            onClick={toggleUnderline}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('underline') ? 'bg-gray-200' : ''}`}
          >
            <span className="underline">U</span>
          </button>
          <button
            type="button"
            onClick={toggleStrike}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('strike') ? 'bg-gray-200' : ''}`}
          >
            <span className="line-through">S</span>
          </button>
        </div>

        {/* 구분선 */}
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        
        {/* 제목 스타일 */}
        <div className="flex gap-1 mr-2">
          <button
            type="button"
            onClick={() => toggleHeading(1)}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
          >
            <span className="font-bold">H1</span>
          </button>
          <button
            type="button"
            onClick={() => toggleHeading(2)}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
          >
            <span className="font-bold">H2</span>
          </button>
          <button
            type="button"
            onClick={() => toggleHeading(3)}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
          >
            <span className="font-bold">H3</span>
          </button>
        </div>

        {/* 구분선 */}
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        
        {/* 리스트 */}
        <div className="flex gap-1 mr-2">
          <button
            type="button"
            onClick={toggleBulletList}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('bulletList') ? 'bg-gray-200' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-4 h-4" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={toggleOrderedList}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('orderedList') ? 'bg-gray-200' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-4 h-4" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM1.713 11.865v-.474H2c.217 0 .363-.137.363-.317 0-.185-.158-.31-.361-.31-.223 0-.367.152-.373.31h-.59c.016-.467.373-.787.986-.787.588-.002.954.291.957.703a.595.595 0 0 1-.492.594v.033a.615.615 0 0 1 .569.631c.003.533-.502.8-1.051.8-.656 0-1-.37-1.008-.794h.582c.008.178.186.306.422.309.254 0 .424-.145.422-.35-.002-.195-.155-.348-.414-.348h-.3zm-.004-4.699h-.604v-.035c0-.408.295-.844.958-.844.583 0 .96.326.96.756 0 .389-.257.617-.476.848l-.537.572v.03h1.054V9H1.143v-.395l.957-.99c.138-.142.293-.304.293-.508 0-.18-.147-.32-.342-.32a.33.33 0 0 0-.342.338v.041zM2.564 5h-.635V2.924h-.031l-.598.42v-.567l.629-.443h.635V5z"/>
            </svg>
          </button>
        </div>

        {/* 구분선 */}
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        
        {/* 정렬 버튼들 */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTextAlign('left')}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-4 h-4" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M2 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setTextAlign('center')}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-4 h-4" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M4 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setTextAlign('right')}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-4 h-4" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M6 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm4-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 에디터 내용 */}
      <EditorContent editor={editor} className="prose max-w-none p-4 min-h-[240px]" />
    </div>
  );
} 