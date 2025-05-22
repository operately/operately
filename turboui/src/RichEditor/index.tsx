import React from "react";

import { Toolbar } from "./components/Toolbar";
import { EditorContext, TipTapEditorContent } from "./EditorContext";
import { useLinkEditFormClose } from "./LinkEditForm";
import { EditorState } from "./useEditor";

export { useEditor } from "./useEditor";
export type { MentionedPersonLookupFn } from "./useEditor";

interface EditorProps {
  editor: EditorState;
  className?: string;
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
export function Editor({ editor }: EditorProps) {
  return (
    <EditorContext.Provider value={editor}>
      <EditorContent />
    </EditorContext.Provider>
  );
}

function EditorContent(): JSX.Element {
  const handleClick = useLinkEditFormClose();

  const className = "border border-surface-outline rounded-lg";

  return (
    <div onClick={handleClick} className={className}>
      <Toolbar />

      <div className="ProseMirror text-content-accent relative">
        <TipTapEditorContent className="p-3 min-h-[100px]" />
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
