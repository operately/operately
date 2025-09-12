import React from "react";

import * as TipTap from "@tiptap/react";
import * as People from "@/models/people";

import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import MentionPeople, { SearchFn } from "@/features/richtexteditor/extensions/MentionPeople";
import Highlight from "@/features/richtexteditor/extensions/Highlight";
import FakeTextSelection from "@/features/richtexteditor/extensions/FakeTextSelection";
import { Toolbar } from "@/features/richtexteditor/components/Toolbar";

import Blob, { isUploadInProgress } from "./Blob";
import * as Blobs from "@/models/blobs";

import { EditorContext } from "./EditorContext";
import { useLinkEditFormClose } from "./LinkEditForm";

type Editor = TipTap.Editor;
export { LinkEditForm } from "./LinkEditForm";
export { EditorContext } from "./EditorContext";

interface OnSaveData {
  json: any;
  html: string;
}

interface OnBlurData {
  json: any;
  html: string;
}

export function Root({ editor, children, className = "" }): JSX.Element {
  const [linkEditActive, setLinkEditActive] = React.useState(false);

  return (
    <EditorContext.Provider value={{ editor, linkEditActive, setLinkEditActive }}>
      <RootBody children={children} className={className}></RootBody>
    </EditorContext.Provider>
  );
}

function RootBody({ children, className = "" }): JSX.Element {
  const handleClick = useLinkEditFormClose();

  return (
    <div onClick={handleClick} className={className}>
      {children}
    </div>
  );
}

interface UseEditorProps {
  mentionSearchScope: People.SearchScope;

  peopleSearch?: SearchFn;
  placeholder?: string;
  content?: any;
  onSave?: (data: OnSaveData) => void;
  onBlur?: (data: OnBlurData) => void;
  onUploadStatusChange?: (uploading: boolean) => void;
  className?: string;
  editable?: boolean;
  autoFocus?: boolean;
  tabindex?: string;
}

export interface EditorState {
  editor: any;
  submittable: boolean;
  focused: boolean;
  empty: boolean;
  uploading: boolean;
}

const DEFAULT_EDITOR_PROPS: Partial<UseEditorProps> = {
  editable: true,
  autoFocus: false,
  tabindex: "",
};

function useEditor(props: UseEditorProps): EditorState {
  props = { ...DEFAULT_EDITOR_PROPS, ...props };

  const [submittable, setSubmittable] = React.useState(true);
  const [focused, setFocused] = React.useState(false);
  const [empty, setEmpty] = React.useState(props.content === undefined || props.content === "");
  const [uploading, setUploading] = React.useState(false);

  const defaultPeopleSearch = People.usePeopleSearch(props.mentionSearchScope);

  const mentionPeople = React.useMemo(() => {
    return MentionPeople.configure(props.peopleSearch || defaultPeopleSearch);
  }, []);

  const uploadFile = React.useCallback((file: File, onProgress: (progress: number) => void) => {
    return Blobs.uploadFile(file, onProgress);
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
      Blob.configure({ uploadFile }),
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

  return { editor: editor, submittable: submittable, focused: focused, empty: empty, uploading: uploading };
}

const EditorContent = TipTap.EditorContent;

export { useEditor, EditorContent, Toolbar };

export function StandardEditorForm({ editor }: { editor: Editor }): JSX.Element {
  return (
    <Root editor={editor}>
      <Toolbar editor={editor} noTopBorder />

      <div className="text-content-accent relative px-2 rounded-t">
        <EditorContent editor={editor} />
      </div>
    </Root>
  );
}
