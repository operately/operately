import * as React from "react";
import { TaskPage } from ".";
import { PrimaryButton, SecondaryButton } from "../Button";
import RichContent, { countCharacters, shortenContent } from "../RichContent";
import { isContentEmpty } from "../RichContent/isContentEmpty";
import { Editor, MentionedPersonLookupFn, useEditor } from "../RichEditor";
import { SectionHeader } from "./SectionHeader";

export function Description(props: TaskPage.Props) {
  const state = useDescriptionState(props);

  if (state.mode == "zero" && !props.canEdit) return null;

  if (state.mode === "zero") {
    return (
      <div>
        <button
          onClick={state.startEdit}
          className="text-content-dimmed hover:text-content-base text-sm transition-colors cursor-pointer"
        >
          Add notes about this task...
        </button>
      </div>
    );
  }

  const editButton = (
    <SecondaryButton size="xxs" onClick={state.startEdit}>
      Edit
    </SecondaryButton>
  );

  return (
    <div>
      <SectionHeader title="Notes" buttons={editButton} showButtons={props.canEdit && state.mode !== "edit"} />

      {state.mode === "view" && <DescriptionContent state={state} />}
      {state.mode === "edit" && <DescriptionEditor state={state} />}
    </div>
  );
}

function DescriptionContent({ state }: { state: State }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const length = React.useMemo(() => {
    return state.description ? countCharacters(state.description, { skipParse: true }) : 0;
  }, [state.description]);

  const displayedDescription = React.useMemo(() => {
    if (length <= 200) {
      return state.description;
    } else if (isExpanded) {
      return state.description;
    } else {
      return shortenContent(state.description!, 200, { suffix: "...", skipParse: true });
    }
  }, [state.description, length, isExpanded]);

  return (
    <div className="mt-2">
      <RichContent content={displayedDescription} mentionedPersonLookup={state.mentionedPersonLookup} />

      {length > 200 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-content-dimmed hover:underline text-sm mt-1 font-medium"
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      )}
    </div>
  );
}

function DescriptionEditor({ state }: { state: State }) {
  return (
    <div className="mt-2">
      <Editor editor={state.editor} />
      <div className="flex gap-2 mt-2">
        <PrimaryButton size="xs" onClick={state.save}>
          Save
        </PrimaryButton>
        <SecondaryButton size="xs" onClick={state.cancel}>
          Cancel
        </SecondaryButton>
      </div>
    </div>
  );
}

interface State {
  description: string | null;
  mode: "view" | "edit" | "zero";
  setMode: React.Dispatch<React.SetStateAction<"view" | "edit" | "zero">>;
  setDescription: React.Dispatch<React.SetStateAction<string | null>>;
  editor: ReturnType<typeof useEditor>;
  mentionedPersonLookup: MentionedPersonLookupFn;
  startEdit: () => void;
  save: () => void;
  cancel: () => void;
}

function useDescriptionState(props: TaskPage.Props): State {
  const initialMode = isContentEmpty(props.description) ? "zero" : "view";

  const [description, setDescription] = React.useState<string | null>(props.description || null);
  const [mode, setMode] = React.useState<"view" | "edit" | "zero">(initialMode);

  React.useEffect(() => {
    setDescription(props.description || null);
  }, [props.description]);

  const editor = useEditor({
    content: props.description,
    editable: true,
    placeholder: "Describe the task...",
    handlers: props.richDescriptionHandlers,
  });

  const save = React.useCallback(async () => {
    const content = editor.getJson();

    const success = await props.onDescriptionChange(content);

    if (success) {
      setDescription(content);

      if (isContentEmpty(content)) {
        setMode("zero");
      } else {
        setMode("view");
      }
    }
  }, [editor, setDescription, setMode, props.onDescriptionChange]);

  const cancel = React.useCallback(() => {
    if (isContentEmpty(description)) {
      setMode("zero");
    } else {
      setMode("view");
    }
  }, [setMode, description]);

  const startEdit = React.useCallback(() => {
    editor.setContent(props.description);
    editor.setFocused(true);
    setMode("edit");
  }, [setMode, editor, props.description]);

  return {
    description,
    mode,
    editor,
    mentionedPersonLookup: props.richDescriptionHandlers.mentionedPersonLookup,
    startEdit,
    setMode,
    setDescription,
    save,
    cancel,
  };
}
