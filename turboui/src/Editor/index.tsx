import * as TipTap from "@tiptap/react";
import React from "react";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { Toolbar } from "./components/Toolbar";
import FakeTextSelection from "./extensions/FakeTextSelection";
import Highlight from "./extensions/Highlight";
import MentionPeople, { SearchFn } from "./extensions/MentionPeople";

import Blob, { isUploadInProgress } from "./Blob";

import { EditorContext } from "./EditorContext";
import { useLinkEditFormClose } from "./LinkEditForm";

export type Editor = TipTap.Editor;
export { EditorContext } from "./EditorContext";
export { LinkEditForm } from "./LinkEditForm";

// new

namespace Editor {
  export interface EditorState {
    peopleSearch: SearchFn;

    tiptapInstance: TipTap.Editor | null;
    focused: boolean;
    empty: boolean;
    uploading: boolean;

    setTipTapInstance: (instance: TipTap.Editor | null) => void;
    setFocused: (focused: boolean) => void;
    setEmpty: (empty: boolean) => void;
    setUploading: (uploading: boolean) => void;
  }

  export interface Props {
    editor: EditorState;

    editable?: boolean;
    content?: any;
    autoFocus?: boolean;
    tabindex?: string;
    className?: string;

    placeholder?: string;
  }
}

export function useEditor({peopleSearch} :{peopleSearch: SearchFn}): Editor.EditorState {
  const [tiptapInstance, setTipTapInstance] = React.useState<TipTap.Editor | null>(null);
  const [focused, setFocused] = React.useState(false);
  const [empty, setEmpty] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);

  return {
    peopleSearch,

    tiptapInstance,
    focused,
    empty,
    uploading,

    setTipTapInstance,
    setFocused,
    setEmpty,
    setUploading,
  };
}

export function Editor(props: Editor.Props) {
  const mentionPeople = React.useMemo(() => {
    return MentionPeople.configure(props.editor.peopleSearch);
  }, []);

  const tiptapInstance = TipTap.useEditor({
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

  React.useEffect(() => {
    props.editor.setTipTapInstance(tiptapInstance);
  }, [tiptapInstance]);

  return <Root editor={props.editor}>
    <Toolbar editor={props.editor} noTopBorder />

    <div className="text-content-accent relative px-2 rounded-t">
      {props.editor.tiptapInstance && <TipTap.EditorContent editor={props.editor.tiptapInstance} />}
    </div>
  </Root>
}

// old

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

// export interface EditorState {
//   editor: any;
//   submittable: boolean;
//   focused: boolean;
//   empty: boolean;
//   uploading: boolean;
// }

// const DEFAULT_EDITOR_PROPS: Partial<UseEditorProps> = {
//   editable: true,
//   autoFocus: false,
//   tabindex: "",
// };