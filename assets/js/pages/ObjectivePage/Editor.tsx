import React from 'react';

import { useEditor, EditorContent } from '@tiptap/react'

import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import BulletList from '@tiptap/extension-bullet-list';

function MenuBarToggle({ children, isActive, onClick }) : JSX.Element {
  const baseClass = "rounded px-1 py-0.5 w-8 text-center";
  const activeClass = baseClass + ' bg-sky-200 text-black';
  const inactiveClass = baseClass + 'bg-stone-100 text-stone-500 rounded hover:bg-sky-200 hover:text-black transition';

  return (
    <button
      onClick={onClick}
      className={isActive ? activeClass : inactiveClass}
    >{children}</button>
  );
}

function BoldButton({ editor }) : JSX.Element {
  return (
    <MenuBarToggle
      onClick={() => editor.chain().focus().toggleBold().run()}
      isActive={editor.isActive('bold')}
    >
      B
    </MenuBarToggle>
  );
}

function ItalicButton({ editor }) : JSX.Element {
  return (
    <MenuBarToggle
      onClick={() => editor.chain().focus().toggleItalic().run()}
      isActive={editor.isActive('italic')}
    >
      <span className="italic font-mono">I</span>
    </MenuBarToggle>
  );
}

function BulletListButton({ editor }) : JSX.Element {
  return (
    <MenuBarToggle
      onClick={() => editor.chain().focus().toggleBulletList().run()}
      isActive={editor.isActive('bulletList')}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    </MenuBarToggle>
  );
}

const MenuBar = ({ editor }) : JSX.Element | null  => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex gap-0.5 border-b border-stone-200 py-1 px-2">
      <BoldButton editor={editor} />
      <ItalicButton editor={editor} />
      <BulletListButton editor={editor} />
    </div>
  );
};

export default function Editor() {
  const editor = useEditor({
    editorProps: {
      attributes: {
        class: 'p-4 prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none'
      }
    },
    extensions: [
      BulletList,
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder: 'Write an update…',
      }),
    ],
  })

  return (
    <div className="mt-4 rounded bg-white shadow-sm border border-stone-200">
      <div className="p-4 py-2 border-b border-stone-200 text-sm">POST AN UPDATE</div>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
