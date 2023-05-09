import React from "react";

import { useEditor, EditorContent } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";

import MenuBar from "./MenuBar";
import MentionPopup from "./MentionPopup";
import Footer from "./Footer";

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

interface EditorProps {
  placeholder: string;
  peopleSearch: EditorMentionSearchFunc;
  onSave?: (data: OnSaveData) => void;
  onBlur?: (data: OnBlurData) => void;
}

export default function Editor({
  placeholder,
  peopleSearch,
  onSave,
  onBlur,
}: EditorProps): JSX.Element {
  const editor = useEditor({
    editorProps: {
      attributes: {
        class:
          "p-4 prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
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
        placeholder: placeholder,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: "text-sky-500",
        },
        suggestion: {
          render: () => new MentionPopup(),
          items: peopleSearch,
        },
      }),
    ],
    onBlur: ({ editor }) => {
      if (!onBlur) return;

      onBlur({
        json: editor.getJSON(),
        html: editor.getHTML(),
      });
    },
    onUpdate: ({ editor }) => {
      setSubmitActive(editor.state.doc.textContent.length > 0);
    },
  });

  const [submitActive, setSubmitActive] = React.useState(false);

  const handleSave = () => {
    if (!editor) return;
    if (!onSave) return;

    onSave({
      json: editor.getJSON(),
      html: editor.getHTML(),
    });
  };

  React.useEffect(() => {
    if (!editor) return;

    editor.commands.focus();
  }, [editor]);

  return (
    <>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      <Footer onSave={handleSave} submitDisabled={!submitActive} />
    </>
  );
}
