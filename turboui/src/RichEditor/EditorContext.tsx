import * as TipTap from "@tiptap/react";
import * as React from "react";

import { EditorState } from "./useEditor";

export const EditorContext = React.createContext<EditorState | null>(null);

export function useUploadFile(): EditorState["editor"]["uploadFile"] {
  return useEditorContext().editor.uploadFile;
}

export function usePerson(id: string): ReturnType<EditorState["editor"]["findPerson"]> {
  return useEditorContext().findPerson(id);
}

export function useLinkState(): [boolean, React.Dispatch<React.SetStateAction<boolean>>] {
  const ctx = useEditorContext();

  return [ctx.linkEditActive, ctx.setLinkEditActive];
}

export function useTipTapEditor(): TipTap.Editor {
  return useEditorContext().editor;
}

function useEditorContext(): EditorState {
  const ctx = React.useContext(EditorContext);

  if (!ctx) {
    throw new Error("useEditorContext must be used within an EditorProvider");
  } else {
    return ctx;
  }
}

export function TipTapEditorContent() {
  const editor = useTipTapEditor();

  return <TipTap.EditorContent editor={editor} />;
}
