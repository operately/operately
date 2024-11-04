import React, { Component } from "react";

import * as TipTap from "@tiptap/react";
import * as People from "@/models/people";

import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";

import { Toolbar } from "@/features/richtexteditor/components/Toolbar";
import { MentionPopup } from "@/features/richtexteditor/components/MentionPopup";

import Blob, { isUploadInProgress } from "./Blob";

import { EditorContext } from "./EditorContext";
import { useLinkEditFormClose } from "./LinkEditForm";

type EditorMentionSearchFunc = ({ query }: { query: string }) => Promise<Person[]>;

export type Editor = TipTap.Editor;
export { LinkEditForm } from "./LinkEditForm";
export { EditorContext } from "./EditorContext";

import { mergeAttributes } from "@tiptap/core";
import { useGetPerson } from "@/api";
import Avatar from "../Avatar";

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
  peopleSearch?: EditorMentionSearchFunc;
  placeholder?: string;
  content?: any;
  onSave?: (data: OnSaveData) => void;
  onBlur?: (data: OnBlurData) => void;
  onUploadStatusChange?: (uploading: boolean) => void;
  className?: string;
  editable?: boolean;
  autoFocus?: boolean;
  mentionSearchScope: People.SearchScope;
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

  const defaultPeopleSearch = People.usePeopleSearch(props.mentionSearchScope);

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
      CustomMention.configure({
        suggestion: {
          render: () => new MentionPopup(),
          items: props.peopleSearch || defaultPeopleSearch,
          allowedPrefixes: [",", "\\s"],
        },
        deleteTriggerWithBackspace: true,
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

const CustomMention = Mention.extend({
  renderHTML({ HTMLAttributes }) {
    return ["react-component", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return TipTap.ReactNodeViewRenderer(Example);
  },
});

function Example({ node }) {
  const { data, loading } = useGetPerson({ id: node.attrs.id });

  const fullName = loading ? node.attrs.label : data?.person?.fullName;
  const firstName = fullName.split(" ")[0];
  const person = data?.person || { fullName: node.attrs.label };

  return (
    <TipTap.NodeViewWrapper className="inline">
      <div className="translate-y-[1px] inline-block mr-0.5">
        <Avatar person={person} size={18} />
      </div>

      <div className="translate-y-[1px] inline-block mr-0.5">
        <Avatar person={{ fullName: node.attrs.label }} size={18} />
      </div>

      {firstName}
    </TipTap.NodeViewWrapper>
  );
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
