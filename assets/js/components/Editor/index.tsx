import React from "react";

import * as TipTap from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import Link from "@tiptap/extension-link";

import Toolbar from "./Toolbar";
import MentionPopup from "./MentionPopup";
import Button from "@/components/Button";
import Blob, { isUploadInProgress } from "./Blob";

export type EditorMentionSearchFunc = ({ query }: { query: string }) => Promise<Person[]>;

export type Editor = TipTap.Editor;

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
  className?: string;
  editable?: boolean;
}

export interface Context {
  linkEditActive: boolean;
  setLinkEditActive: (active: boolean) => void;
}

export const EditorContext = React.createContext<Context | null>(null);

export function Root({ children }): JSX.Element {
  const [linkEditActive, setLinkEditActive] = React.useState(false);

  return <EditorContext.Provider value={{ linkEditActive, setLinkEditActive }}>{children}</EditorContext.Provider>;
}

export interface EditorState {
  editor: any;
  submittable: boolean;
  focused: boolean;
  empty: boolean;
  uploading: boolean;
}

function useEditor(props: UseEditorProps): EditorState {
  const [submittable, setSubmittable] = React.useState(true);
  const [focused, setFocused] = React.useState(false);
  const [empty, setEmpty] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);

  const editable = props.editable === undefined ? true : props.editable;

  const editor = TipTap.useEditor({
    editable: editable,
    content: props.content,
    autofocus: editable,
    injectCSS: false,
    editorProps: {
      attributes: {
        class: "focus:outline-none" + " " + props.className,
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
        dropcursor: false,
      }),
      Blob,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: props.placeholder,
      }),
      Mention.configure({
        suggestion: {
          render: () => new MentionPopup(),
          items: props.peopleSearch,
        },
      }),
    ],
    onFocus() {
      setFocused(true);
    },
    onBlur: ({ editor }) => {
      setFocused(false);

      if (!props.onBlur) return;

      props.onBlur({
        json: editor.getJSON(),
        html: editor.getHTML(),
      });
    },
    onUpdate: (props) => {
      setUploading(isUploadInProgress(props.editor.state.doc));
      setSubmittable(!isUploadInProgress(props.editor.state.doc));
      setEmpty(props.editor.state.doc.childCount === 1 && props.editor.state.doc.firstChild?.childCount === 0);
    },
  });

  return { editor: editor, submittable: submittable, focused: focused, empty: empty, uploading: uploading };
}

const EditorContent = TipTap.EditorContent;

export function LinkEditForm({ editor }): JSX.Element {
  const { linkEditActive, setLinkEditActive } = React.useContext(EditorContext) as Context;
  const [link, setLink] = React.useState(editor?.getAttributes("link")?.href || "");

  const unlink = React.useCallback(() => {
    editor.chain().focus().unsetLink().run();
    setLinkEditActive(false);
  }, [editor]);

  const save = React.useCallback(() => {
    editor.chain().focus().setLink({ href: link }).run();
    setLinkEditActive(false);
  }, [editor, link]);

  if (!editor) return <></>;
  if (!editor.isActive("link")) return <></>;
  if (!linkEditActive) return <></>;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-24 bg-dark-2 border-t border-shade-3">
      <div className="p-4 flex flex-col gap-1 w-full h-full">
        <label className="text-sm font-bold">Link URL:</label>

        <div className="flex items-center gap-2">
          <input
            autoFocus
            type="text"
            className="flex-1 px-2 py-1 border border-indigo-400 rounded-lg text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 text-white-1"
            value={link}
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
