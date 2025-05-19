import React from "react";

import * as TipTap from "@tiptap/react";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import Blob, { isUploadInProgress } from "./Blob";
import FakeTextSelection from "./extensions/FakeTextSelection";
import Highlight from "./extensions/Highlight";
import MentionPeople, { SearchFn } from "./extensions/MentionPeople";

export interface Person {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

interface OnSaveData {
  json: any;
  html: string;
}

interface OnBlurData {
  json: any;
  html: string;
}

export type UploadFileFn = (file: File, onProgress: (progress: number) => void) => Promise<{ id: string; url: string }>;
export type MentionedPersonLookupFn = (id: string) => Promise<Person | null>;

interface UseEditorProps {
  placeholder?: string;
  content?: any;
  onSave?: (data: OnSaveData) => void;
  onBlur?: (data: OnBlurData) => void;
  onUploadStatusChange?: (uploading: boolean) => void;
  className?: string;
  editable?: boolean;
  autoFocus?: boolean;
  tabindex?: string;

  mentionedPersonLookup: MentionedPersonLookupFn;
  peopleSearch?: SearchFn;
  uploadFile?: UploadFileFn;
}

export interface EditorState {
  editor: any;
  submittable: boolean;
  focused: boolean;
  empty: boolean;
  uploading: boolean;
  linkEditActive: boolean;
  setLinkEditActive: (active: boolean) => void;
  mentionedPersonLookup: MentionedPersonLookupFn;
  uploadFile: UploadFileFn;
  setContent: (content: any) => void;
}

const DEFAULT_EDITOR_PROPS: Partial<UseEditorProps> = {
  editable: true,
  autoFocus: false,
  tabindex: "",
};

export function useEditor(props: UseEditorProps): EditorState {
  props = { ...DEFAULT_EDITOR_PROPS, ...props };

  if (props.editable) {
    if (!props.peopleSearch) {
      throw new Error("peopleSearch function is required when editable is true");
    }
  }

  const [linkEditActive, setLinkEditActive] = React.useState(false);
  const [submittable, setSubmittable] = React.useState(true);
  const [focused, setFocused] = React.useState(false);
  const [empty, setEmpty] = React.useState(props.content === undefined || props.content === "");
  const [uploading, setUploading] = React.useState(false);

  const mentionPeople = React.useMemo(() => {
    return MentionPeople.configure(props.peopleSearch);
  }, []);

  const editor = TipTap.useEditor({
    editable: props.editable,
    content: props.content,
    autofocus: props.autoFocus,
    injectCSS: false,
    editorProps: {
      attributes: {
        class: "focus:outline-none" + " " + props.className,
        tabindex: props.tabindex!,
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
      Link.extend({ inclusive: false }).configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: props.placeholder }),
      mentionPeople,
      Highlight,
      FakeTextSelection,
    ],
    onFocus({ editor }) {
      editor.chain().unsetFakeTextSelection().run();

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
    onUpdate: ({ editor }) => {
      const isUploading = isUploadInProgress(editor.state.doc);

      if (props.onUploadStatusChange && isUploading !== uploading) {
        props.onUploadStatusChange(isUploading);
      }

      setUploading(isUploading);
      setSubmittable(!isUploading);

      setEmpty(editor.state.doc.childCount === 1 && editor.state.doc.firstChild?.childCount === 0);
    },
  });

  const setContent = React.useCallback(
    (content: any) => {
      if (!editor) return;
      editor.commands.setContent(content);
    },
    [editor],
  );

  return {
    editor,
    submittable,
    focused,
    empty,
    uploading,
    linkEditActive,
    setLinkEditActive,
    mentionedPersonLookup: props.mentionedPersonLookup,
    uploadFile: props.uploadFile!,
    setContent,
  };
}
