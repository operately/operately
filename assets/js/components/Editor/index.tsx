import React from "react";

import * as TipTap from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";

import Toolbar from "./Toolbar";
import MentionPopup from "./MentionPopup";
import Blob, { isUploadInProgress } from "./Blob";

export { LinkEditForm } from "./LinkEditForm";
export { EditorContext } from "./EditorContext";
import { EditorContext } from "./EditorContext";

type EditorMentionSearchFunc = ({ query }: { query: string }) => Promise<Person[]>;

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

export function Root({ children }): JSX.Element {
  const [linkEditActive, setLinkEditActive] = React.useState(false);

  const handleClick = React.useCallback(
    (e: any) => {
      // close link edit form if clicked outside the link edit form
      if (linkEditActive && !e.target.matches("[data-link-edit-form]  *")) {
        e.preventDefault();
        e.stopPropagation();

        setLinkEditActive(false);
      }
    },
    [linkEditActive],
  );

  return (
    <div onClick={handleClick}>
      <EditorContext.Provider value={{ linkEditActive, setLinkEditActive }}>{children}</EditorContext.Provider>
    </div>
  );
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
      Highlight.configure({
        multicolor: true,
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

export { useEditor, EditorContent, Toolbar };
