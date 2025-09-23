import * as TipTap from "@tiptap/react";
import * as React from "react";

import { EditorState, Person } from "./useEditor";

export const EditorContext = React.createContext<EditorState | null>(null);

export function useUploadFile(): EditorState["uploadFile"] {
  return useEditorContext().uploadFile;
}

export function usePerson(id: string): Person | null {
  const [person, setPerson] = React.useState<Person | null>(null);
  const { mentionedPersonLookup } = useEditorContext();

  React.useEffect(() => {
    let isMounted = true;

    const fetchPerson = async () => {
      try {
        const result = await mentionedPersonLookup?.(id);
        if (isMounted && result) {
          setPerson(result);
        }
      } catch (error) {
        console.error("Error fetching person:", error);
        if (isMounted) {
          setPerson(null);
        }
      }
    };

    fetchPerson();

    return () => {
      isMounted = false;
    };
  }, [id, mentionedPersonLookup]);

  return person;
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

export function TipTapEditorContent({ className = "" }: { className?: string }) {
  const editor = useTipTapEditor();

  return <TipTap.EditorContent editor={editor} className={className} />;
}
