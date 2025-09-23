import * as React from "react";
import { TaskPage } from ".";
import { PrimaryButton, SecondaryButton } from "../Button";
import RichContent, { countCharacters, shortenContent } from "../RichContent";
import { isContentEmpty } from "../RichContent/isContentEmpty";
import { Editor, MentionedPersonLookupFn, useEditor } from "../RichEditor";
import { SectionHeader } from "./SectionHeader";

export function Description(props: TaskPage.Props) {
  const initialMode = isContentEmpty(props.description) ? "zero" : "view";
  const [mode, setMode] = React.useState<"view" | "edit" | "zero">(initialMode);

  const startEdit = () => setMode("edit");

  if (mode === "zero") {
    return <ZeroState startEdit={startEdit} canEdit={props.canEdit} />;
  }

  const editButton = (
    <SecondaryButton size="xxs" onClick={startEdit}>
      Edit
    </SecondaryButton>
  );

  return (
    <div>
      <SectionHeader title="Notes" buttons={editButton} showButtons={props.canEdit && mode !== "edit"} />

      {mode === "view" && (
        <ViewMode
          description={props.description}
          mentionedPersonLookup={props.richTextHandlers.mentionedPersonLookup}
        />
      )}
      {mode === "edit" && <EditMode {...props} setMode={setMode} />}
    </div>
  );
}

interface ViewModeProps {
  description: any;
  mentionedPersonLookup: MentionedPersonLookupFn;
}

function ViewMode({ description, mentionedPersonLookup }: ViewModeProps) {
  const { description: displayedDescription, isExpanded, toggleExpand } = useExpandDescription(description);

  return (
    <div className="mt-2">
      <RichContent content={displayedDescription} mentionedPersonLookup={mentionedPersonLookup} />

      {length > 200 && (
        <button onClick={toggleExpand} className="text-content-dimmed hover:underline text-sm mt-1 font-medium">
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      )}
    </div>
  );
}

interface EditModeProps extends TaskPage.Props {
  setMode: React.Dispatch<React.SetStateAction<"view" | "edit" | "zero">>;
}

function EditMode({ description, richTextHandlers, onDescriptionChange, setMode }: EditModeProps) {
  const editor = useEditor({
    content: description,
    editable: true,
    placeholder: "Describe the task...",
    handlers: richTextHandlers,
  });

  const save = React.useCallback(async () => {
    const content = editor.getJson();

    const success = await onDescriptionChange(content);

    if (success) {
      if (isContentEmpty(content)) {
        setMode("zero");
      } else {
        setMode("view");
      }
    }
  }, [editor, setMode, onDescriptionChange]);

  const cancel = React.useCallback(() => {
    setMode("view");
  }, [setMode]);

  return (
    <div className="mt-2">
      <Editor editor={editor} />
      <div className="flex gap-2 mt-2">
        <PrimaryButton size="xs" onClick={save}>
          Save
        </PrimaryButton>
        <SecondaryButton size="xs" onClick={cancel}>
          Cancel
        </SecondaryButton>
      </div>
    </div>
  );
}

function ZeroState({ startEdit, canEdit }: { startEdit: () => void; canEdit: boolean }) {
  if (!canEdit) return null;

  return (
    <div>
      <button
        onClick={startEdit}
        className="text-content-dimmed hover:text-content-base text-sm transition-colors cursor-pointer"
      >
        Add notes about this task...
      </button>
    </div>
  );
}

function useExpandDescription(rawDescription: any) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const description = React.useMemo(() => {
    const length = rawDescription ? countCharacters(rawDescription, { skipParse: true }) : 0;

    if (length <= 200 || isExpanded) {
      return rawDescription;
    } else {
      return shortenContent(rawDescription!, 200, { suffix: "...", skipParse: true });
    }
  }, [rawDescription, isExpanded]);

  const toggleExpand = React.useCallback(() => setIsExpanded((prev) => !prev), [setIsExpanded]);

  return {
    description,
    isExpanded,
    toggleExpand,
  };
}
