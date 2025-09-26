import React from "react";

import { Toolbar } from "./components/Toolbar";
import { EditorContext, TipTapEditorContent } from "./EditorContext";
import { useLinkEditFormClose } from "./LinkEditForm";
import { EditorState } from "./useEditor";
import classNames from "../utils/classnames";

export { useEditor } from "./useEditor";
export type { MentionedPersonLookupFn } from "./useEditor";

interface EditorProps {
  editor: EditorState;
  className?: string;
  hideBorder?: boolean;
  hideToolbar?: boolean;
  padding?: string;
}

//
// Use this component to render the editor in the editor mode.
// It will render the editor with the toolbar and the content area.
// It will also provide the editor context to the children components.
//
// Usage:
//
// const editor = useEditor({...})
//
// <Editor editor={editor} />
//
export function Editor(props: EditorProps) {
  return (
    <EditorContext.Provider value={props.editor}>
      <EditorContent {...props} />
    </EditorContext.Provider>
  );
}

function EditorContent(props: EditorProps): JSX.Element {
  const handleClick = useLinkEditFormClose();
  const editor = props.editor.editor;

  const handleFocus = () => {
    // Focus the editor if it's not already focused and is editable
    if (editor && !editor.isFocused && editor.isEditable) {
      editor.commands.focus();
    }
  };

  const className = classNames(
    {
      "border border-surface-outline rounded-lg": !props.hideBorder,
    },
    "cursor-pointer",
    props.className,
  );
  const contentClassName = classNames("min-h-[100px]", props.padding ?? "p-3");

  return (
    <div onClick={handleClick} className={className}>
      {!props.hideToolbar && <Toolbar />}

      <div onClick={handleFocus} className="ProseMirror text-content-accent relative">
        <TipTapEditorContent className={contentClassName} />
      </div>
    </div>
  );
}

//
// Use this component to render the rich content in the read-only mode.
// It will render the content only without borders, toolbar, and other editor features.
// It will also provide the editor context to the children components.
//
export function Content({ editor, className = "" }: EditorProps): JSX.Element {
  return (
    <EditorContext.Provider value={editor}>
      <div className={"ProseMirror " + className}>
        <TipTapEditorContent />
      </div>
    </EditorContext.Provider>
  );
}
