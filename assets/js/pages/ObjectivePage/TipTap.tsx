import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react'

import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

const Tiptap = ({className}) => {
  const editor = useEditor({
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none'
      }
    },
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write an update…',
      }),
    ],
  })

  return (
    <EditorContent className={className} editor={editor} />
  )
}

export default Tiptap
