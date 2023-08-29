import React from "react";

import * as TipTap from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import Link from "@tiptap/extension-link";

import Toolbar from "./Toolbar";
import MentionPopup from "./MentionPopup";

import Button from "@/components/Button";

export type EditorMentionSearchFunc = ({ query }: { query: string }) => Promise<Person[]> | any[];

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
  content?: any;
  onSave?: (data: OnSaveData) => void;
  onBlur?: (data: OnBlurData) => void;
}

function useEditor(props: UseEditorProps): TipTap.Editor | null {
  const [_submitActive, setSubmitActive] = React.useState(false);

  return TipTap.useEditor({
    content: props.content,
    autofocus: true,
    injectCSS: false,
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
      Link.configure({
        openOnClick: false,
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

export function LinkEditForm({ editor }): JSX.Element {
  const [link, setLink] = React.useState(editor?.getAttributes("link")?.href || "");

  const unlink = React.useCallback(() => {
    editor.chain().focus().unsetLink().run();
  }, [editor]);

  const save = React.useCallback(() => {
    editor.chain().focus().setLink({ href: link }).run();
  }, [editor, link]);

  if (!editor) return <></>;
  if (!editor.isActive("link")) return <></>;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-24 bg-dark-2 border-t border-shade-3 rounded-b-lg">
      <div className="p-4 flex flex-col gap-1 w-full h-full">
        <label className="text-sm font-bold">Link URL:</label>

        <div className="flex items-center gap-2">
          <input
            autoFocus
            type="text"
            className="flex-1 px-2 py-1 border border-indigo-400 rounded-lg text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 text-white-1"
            value={link.href}
            placeholder="ex. https://example.com"
            onChange={(e) => setLink(e.target.value)}
          />

          <Button onClick={save} variant="success" size="small">
            Save
          </Button>

          <Button onClick={unlink} variant="secondary" size="small">
            Unlink
          </Button>
        </div>
      </div>
    </div>
  );
}

export { useEditor, EditorContent, Toolbar };
