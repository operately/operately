import React from "react";

import * as TipTap from "@tiptap/react";

import { isUploadInProgress } from "./Blob";
import { createRichEditorExtensions } from "./createRichEditorExtensions";
import {
  clearLocalDraft,
  isRichTextEmpty,
  LocalDraftOptions,
  readLocalDraft,
  writeLocalDraft,
} from "./localDrafts";
import { SearchFn } from "./extensions/MentionPeople";

export interface Person {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  title: string;
  profileLink: string;
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

export interface RichEditorHandlers {
  mentionedPersonLookup: MentionedPersonLookupFn;
  peopleSearch?: SearchFn;
  uploadFile?: UploadFileFn;
}

interface UseEditorProps {
  placeholder?: string;
  content?: any;
  onSave?: (data: OnSaveData) => void;
  onBlur?: (data: OnBlurData) => void;
  onUpdate?: (data: { json: any; html: string }) => void;
  onUploadStatusChange?: (uploading: boolean) => void;
  className?: string;
  editable?: boolean;
  autoFocus?: boolean;
  tabindex?: string;
  localDraft?: LocalDraftOptions;

  handlers: RichEditorHandlers;
}

export interface EditorState {
  editor: any;
  submittable: boolean;
  focused: boolean;
  empty: boolean;
  uploading: boolean;
  linkEditActive: boolean;
  setLinkEditActive: (active: boolean) => void;
  mentionedPersonLookup?: MentionedPersonLookupFn;
  uploadFile?: UploadFileFn;
  setContent: (content: any) => void;
  setFocused: (focused: boolean) => void;
  getJson: () => any;
  localDraftRestored: boolean;
  clearLocalDraft: () => void;
}

const DEFAULT_EDITOR_PROPS: Partial<UseEditorProps> = {
  editable: true,
  autoFocus: false,
  tabindex: "",
};

export function useEditor(props: UseEditorProps): EditorState {
  props = { ...DEFAULT_EDITOR_PROPS, ...props };

  const [linkEditActive, setLinkEditActive] = React.useState(false);
  const [submittable, setSubmittable] = React.useState(true);
  const [focused, setFocused] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const baseContent = React.useRef(props.content);
  const [restoredDraft] = React.useState(() => readLocalDraft(props.localDraft, baseContent.current));
  const initialContent = restoredDraft ?? props.content;
  const [empty, setEmpty] = React.useState(isRichTextEmpty(initialContent));

  const extensions = React.useMemo(
    () =>
      createRichEditorExtensions(props.handlers, {
        editable: props.editable,
        placeholder: props.placeholder,
      }),
    [props.handlers.uploadFile, props.handlers.peopleSearch, props.editable, props.placeholder],
  );

  const editorProps = React.useMemo(
    () => ({
      attributes: {
        class: "focus:outline-none" + " " + props.className,
        tabindex: props.tabindex!,
      },
    }),
    [props.className, props.tabindex],
  );

  const editor = TipTap.useEditor({
    shouldRerenderOnTransaction: true,
    editable: props.editable,
    content: initialContent,
    autofocus: props.autoFocus,
    injectCSS: false,
    editorProps,
    extensions,
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

      const json = editor.getJSON();

      setEmpty(editor.state.doc.childCount === 1 && editor.state.doc.firstChild?.childCount === 0);

      if (props.editable && !isUploading) {
        writeLocalDraft(props.localDraft, json, baseContent.current);
      }

      if (props.onUpdate) {
        props.onUpdate({
          json,
          html: editor.getHTML(),
        });
      }
    },
  });

  const setContent = React.useCallback(
    (content: any) => {
      if (!editor) return;
      editor.commands.setContent(content, { emitUpdate: false });
    },
    [editor],
  );

  const getJson = React.useCallback(() => {
    if (!editor) return null;
    return editor.getJSON();
  }, [editor]);

  const clearDraft = React.useCallback(() => {
    clearLocalDraft(props.localDraft);
  }, [props.localDraft?.key, props.localDraft?.enabled, props.localDraft?.ttlMs]);

  React.useEffect(() => {
    if (!editor) return;

    if (focused) {
      editor.chain().focus().run();
    }
  }, [editor, focused]);

  return {
    editor,
    submittable,
    focused,
    empty,
    uploading,
    linkEditActive,
    setLinkEditActive,
    mentionedPersonLookup: props.handlers.mentionedPersonLookup,
    uploadFile: props.handlers.uploadFile,
    setContent,
    setFocused,
    getJson,
    localDraftRestored: Boolean(restoredDraft),
    clearLocalDraft: clearDraft,
  };
}
