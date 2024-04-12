import React from "react";

import * as TipTap from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";

import { MenuBar as Toolbar } from "@/features/richtexteditor/components/MenuBar";
import MentionPopup from "./MentionPopup";
import Blob, { isUploadInProgress } from "./Blob";

export { LinkEditForm } from "./LinkEditForm";
export { EditorContext } from "./EditorContext";
import { EditorContext } from "./EditorContext";
import { useLinkEditFormClose } from "./LinkEditForm";

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
  autoFocus?: boolean;
}

export function Root({ editor, children }): JSX.Element {
  const [linkEditActive, setLinkEditActive] = React.useState(false);

  return (
    <EditorContext.Provider value={{ editor, linkEditActive, setLinkEditActive }}>
      <RootBody children={children}></RootBody>
    </EditorContext.Provider>
  );
}

function RootBody({ children }) {
  const handleClick = useLinkEditFormClose();

  return <div onClick={handleClick}>{children}</div>;
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
  const [empty, setEmpty] = React.useState(props.content === undefined || props.content === "");
  const [uploading, setUploading] = React.useState(false);

  const editable = props.editable === undefined ? true : props.editable;
  const autoFocus = props.autoFocus === undefined ? true : props.autoFocus;

  const editor = TipTap.useEditor({
    editable: editable,
    content: props.content,
    autofocus: autoFocus,
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
      Link.extend({
        inclusive: false,
      }).configure({
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
    onFocus({ editor }) {
      editor.chain().unsetHighlight().run(); // remove highlighted text for link edit

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

export function StandardEditorForm({ editor }: { editor: Editor }): JSX.Element {
  return (
    <Root editor={editor}>
      <Toolbar editor={editor} noTopBorder />

      <div className="text-content-accent text-lg relative px-4 rounded-t">
        <EditorContent editor={editor} />
      </div>
    </Root>
  );
}
