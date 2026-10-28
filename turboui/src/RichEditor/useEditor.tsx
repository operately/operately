import { useEmbedding } from "../Embedding";
import React from "react";

import * as TipTap from "@tiptap/react";

import { isUploadInProgress } from "./Blob";
import { createRichEditorExtensions } from "./createRichEditorExtensions";
import { clearLocalDraft, isRichTextEmpty, LocalDraftOptions, readLocalDraft, writeLocalDraft } from "./localDrafts";
import { SearchFn } from "./extensions/MentionPeople";
import { restoreRichTextSource } from "../RichContent/restoreSource";
import { createResourceLinkPlugin, type ResolveResourceLinks } from "./extensions/Link/resourceLinks";
import {
  InlineCommentCommands,
  createInlineCommentsPlugin,
  inlineCommentsKey,
  type InlineCommentsOptions,
} from "./extensions/InlineComments";
import { normalizeRichTextContent } from "./richTextContent";

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
  resolveResourceLinks: ResolveResourceLinks | null;
  mentionedPersonLookup: MentionedPersonLookupFn;
  peopleSearch?: SearchFn;
  uploadFile?: UploadFileFn;
}

interface UseEditorProps {
  inlineComments?: InlineCommentsOptions;
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
  thumbnailBlobs?: boolean;
  transformContent?: (content: any) => any;

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
  const embedding = useEmbedding();

  const [linkEditActive, setLinkEditActive] = React.useState(false);
  const [submittable, setSubmittable] = React.useState(true);
  const [focused, setFocused] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [baseContent] = React.useState(() =>
    normalizeRichTextContent(props.editable ? restoreRichTextSource(props.content) : props.content),
  );
  const [restoredDraft] = React.useState(() => readLocalDraft(props.localDraft, baseContent));
  const sourceContent = props.editable ? (restoredDraft ?? baseContent) : baseContent;
  const initialContent = normalizeRichTextContent(props.transformContent?.(sourceContent) ?? sourceContent);
  const [empty, setEmpty] = React.useState(isRichTextEmpty(initialContent));
  const placeholderRef = React.useRef(props.placeholder);
  const placeholder = React.useCallback(() => placeholderRef.current ?? "", []);

  const inlineCommentsRef = React.useRef(props.inlineComments);
  inlineCommentsRef.current = props.inlineComments;

  const extensions = React.useMemo(
    () => [
      ...createRichEditorExtensions(props.handlers, {
        editable: props.editable,
        placeholder,
        thumbnailBlobs: props.thumbnailBlobs,
        portalContainer: embedding?.portalContainer,
      }),
      InlineCommentCommands,
    ],
    [
      props.handlers.uploadFile,
      props.handlers.peopleSearch,
      props.editable,
      placeholder,
      props.thumbnailBlobs,
      embedding?.portalContainer,
    ],
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
    // Markdown shortcuts apply only while typing, except Highlight's
    // "==text==" paste behavior. Link handles URLs during clipboard parsing.
    enablePasteRules: ["highlight"],
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
        json: props.editable ? restoreRichTextSource(editor.getJSON()) : editor.getJSON(),
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

      const json = props.editable ? restoreRichTextSource(editor.getJSON()) : editor.getJSON();

      setEmpty(editor.state.doc.childCount === 1 && editor.state.doc.firstChild?.childCount === 0);

      if (props.editable && !isUploading) {
        writeLocalDraft(props.localDraft, json, baseContent);
      }

      if (props.onUpdate) {
        props.onUpdate({
          json,
          html: editor.getHTML(),
        });
      }
    },
  });

  React.useEffect(() => {
    placeholderRef.current = props.placeholder;
    if (!editor || editor.isDestroyed) return;

    // Refresh placeholder decorations without changing the document, selection, or undo history.
    editor.view.dispatch(editor.state.tr);
  }, [editor, props.placeholder]);

  React.useEffect(() => {
    if (!editor || !props.editable || !props.handlers.resolveResourceLinks) return;

    const plugin = createResourceLinkPlugin(props.handlers.resolveResourceLinks);
    editor.registerPlugin(plugin);

    return () => {
      editor.unregisterPlugin("resourceLinkTitles");
    };
  }, [editor, props.editable, props.handlers.resolveResourceLinks]);

  const inlineCommentsEnabled = props.inlineComments !== undefined;

  React.useEffect(() => {
    if (!editor || !inlineCommentsEnabled) return;

    editor.registerPlugin(
      createInlineCommentsPlugin({
        ranges: restoredDraft ? [] : (inlineCommentsRef.current?.ranges ?? []),
        activeThreadId: inlineCommentsRef.current?.activeThreadId,
        onSelectionChange: (selection) => inlineCommentsRef.current?.onSelectionChange?.(selection),
        onThreadClick: (ids) => inlineCommentsRef.current?.onThreadClick?.(ids),
      }),
    );

    return () => {
      editor.unregisterPlugin(inlineCommentsKey);
    };
  }, [editor, inlineCommentsEnabled, restoredDraft]);

  const setContent = React.useCallback(
    (content: any) => {
      if (!editor) return;
      const source = props.editable ? restoreRichTextSource(content) : content;
      editor
        .chain()
        .setContent(normalizeRichTextContent(props.transformContent?.(source) ?? source), { emitUpdate: false })
        .command(({ tr }) => {
          tr.setMeta(inlineCommentsKey, { ranges: inlineCommentsRef.current?.ranges ?? [] });
          return true;
        })
        .run();
    },
    [editor, props.transformContent, props.editable],
  );

  // Synchronize read-only readers when their backend response changes.
  const contentKey = props.editable ? "" : JSON.stringify(props.content ?? null);
  React.useEffect(() => {
    if (!editor || props.editable) return;
    setContent(JSON.parse(contentKey));
  }, [editor, props.editable, contentKey, setContent]);

  // Callback/active changes must not reset ranges that already moved with local edits.
  const rangesKey = JSON.stringify(props.inlineComments?.ranges ?? []);
  React.useEffect(() => {
    if (!editor || !inlineCommentsKey.getState(editor.state)) return;
    editor.commands.setInlineCommentRanges(restoredDraft ? [] : JSON.parse(rangesKey));
  }, [editor, rangesKey, restoredDraft, inlineCommentsEnabled]);

  React.useEffect(() => {
    if (!editor || !inlineCommentsKey.getState(editor.state)) return;
    editor.commands.setActiveInlineThread(props.inlineComments?.activeThreadId ?? null);
  }, [editor, props.inlineComments?.activeThreadId, inlineCommentsEnabled]);

  const getJson = React.useCallback(() => {
    if (!editor) return null;
    return props.editable ? restoreRichTextSource(editor.getJSON()) : editor.getJSON();
  }, [editor, props.editable]);

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
