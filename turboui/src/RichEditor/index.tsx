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
export function Editor({ editor, className = "" }: EditorProps) {
  return (
    <EditorContext.Provider value={editor}>
      <EditorContent className={className} />
    </EditorContext.Provider>
  );
}

function EditorContent({ className = "" }): JSX.Element {
  const handleClick = useLinkEditFormClose();

  return (
    <div onClick={handleClick} className={className}>
      <Toolbar />

      <div className="ProseMirror text-content-accent relative px-2 rounded-t">
        <TipTapEditorContent />
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
