import * as React from "react";
import { EditorState } from ".";

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

export function useTipTapEditor(): EditorState {
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
