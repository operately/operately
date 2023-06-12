import React from "react";

import * as TipTap from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";

import Toolbar from "./Toolbar";
import MentionPopup from "./MentionPopup";

export type EditorMentionSearchFunc = ({
  query,
}: {
  query: string;
}) => Promise<Person[]> | any[];

interface Person {
  id: string;
  fullName: string;
}

interface OnSaveData {
  json: any;
  html: string;
}

interface OnBlurData {
  json: any;
  html: string;
}

interface UseEditorProps {
  peopleSearch?: EditorMentionSearchFunc;
  placeholder?: string;
  onSave?: (data: OnSaveData) => void;
  onBlur?: (data: OnBlurData) => void;
}

function useEditor(props: UseEditorProps): TipTap.Editor | null {
  const [_submitActive, setSubmitActive] = React.useState(false);

  return TipTap.useEditor({
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
    },
    extensions: [
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
        placeholder: props.placeholder,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: "text-pink-400",
        },
        suggestion: {
          render: () => new MentionPopup(),
          items: props.peopleSearch,
        },
      }),
    ],
    onBlur: ({ editor }) => {
      if (!props.onBlur) return;

      props.onBlur({
        json: editor.getJSON(),
        html: editor.getHTML(),
      });
    },
    onUpdate: ({ editor }) => {
      setSubmitActive(editor.state.doc.textContent.length > 0);
    },
  });
}

const EditorContent = TipTap.EditorContent;

export { useEditor, EditorContent, Toolbar };
