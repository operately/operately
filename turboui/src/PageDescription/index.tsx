import React, { useMemo, useState, useCallback } from "react";
import { PrimaryButton, SecondaryButton } from "../Button";
import RichContent, { countCharacters, isContentEmpty, shortenContent } from "../RichContent";
import { Editor, MentionedPersonLookupFn, useEditor } from "../RichEditor";
import { RichEditorHandlers } from "../RichEditor/useEditor";

interface Props {
  description: any;
  onDescriptionChange: (newDescription: any) => Promise<boolean>;
  richTextHandlers: RichEditorHandlers;
  canEdit?: boolean;
  placeholder?: string;
  zeroStatePlaceholder?: string;
  testId?: string;
  emptyTestId?: string;
}

export function PageDescription({
  description,
  onDescriptionChange,
  richTextHandlers,
  canEdit,
  placeholder = "Describe...",
  zeroStatePlaceholder = "Add notes...",
  testId,
  emptyTestId,
}: Props) {
  const initialMode = isContentEmpty(description) ? "zero" : "view";
  const [mode, setMode] = useState<"view" | "edit" | "zero">(initialMode);

  const startEdit = () => setMode("edit");

  if (mode === "zero") {
    return (
      <ZeroState startEdit={startEdit} canEdit={canEdit} placeholder={zeroStatePlaceholder} testId={emptyTestId} />
    );
  }

  return (
    <div data-test-id={testId}>
      <SectionHeader title="Notes" startEdit={startEdit} showButtons={canEdit && mode !== "edit"} />

      {mode === "view" && (
        <ViewMode rawDescription={description} mentionedPersonLookup={richTextHandlers.mentionedPersonLookup} />
      )}
      {mode === "edit" && (
        <EditMode
          description={description}
          richTextHandlers={richTextHandlers}
          onDescriptionChange={onDescriptionChange}
          setMode={setMode}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  startEdit: () => void;
  showButtons?: boolean;
}

function SectionHeader({ title, startEdit, showButtons }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="font-bold">{title}</h2>
      {showButtons && (
        <SecondaryButton size="xxs" onClick={startEdit}>
          Edit
        </SecondaryButton>
      )}
    </div>
  );
}

interface ViewModeProps {
  rawDescription: any;
  mentionedPersonLookup: MentionedPersonLookupFn;
}

function ViewMode({ rawDescription, mentionedPersonLookup }: ViewModeProps) {
  const { description, length, isExpanded, toggleExpand } = useExpandDescription(rawDescription);

  return (
    <div className="mt-2">
      <RichContent content={description} mentionedPersonLookup={mentionedPersonLookup} />

      {length > 200 && (
        <button onClick={toggleExpand} className="text-content-dimmed hover:underline text-sm mt-1 font-medium">
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      )}
    </div>
  );
}

interface EditModeProps {
  description: any;
  richTextHandlers: RichEditorHandlers;
  onDescriptionChange: (newDescription: any) => Promise<boolean>;
  setMode: React.Dispatch<React.SetStateAction<"view" | "edit" | "zero">>;
  placeholder: string;
}

function EditMode({ description, richTextHandlers, onDescriptionChange, setMode, placeholder }: EditModeProps) {
  const editor = useEditor({
    content: description,
    editable: true,
    placeholder,
    handlers: richTextHandlers,
  });

  const save = useCallback(async () => {
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

  const cancel = useCallback(() => {
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

interface ZeroStateProps {
  startEdit: () => void;
  canEdit?: boolean;
  placeholder: string;
  testId?: string;
}

function ZeroState({ startEdit, canEdit, placeholder, testId }: ZeroStateProps) {
  if (!canEdit) return null;

  return (
    <div data-test-id={testId}>
      <button
        onClick={startEdit}
        className="text-content-dimmed hover:text-content-base text-sm transition-colors cursor-pointer"
      >
        {placeholder}
      </button>
    </div>
  );
}

function useExpandDescription(rawDescription: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  const length = useMemo(() => {
    return rawDescription ? countCharacters(rawDescription, { skipParse: true }) : 0;
  }, [rawDescription]);

  const description = useMemo(() => {
    if (length <= 200 || isExpanded) {
      return rawDescription;
    } else {
      return shortenContent(rawDescription, 200, { suffix: "...", skipParse: true });
    }
  }, [rawDescription, length, isExpanded]);

  const toggleExpand = useCallback(() => setIsExpanded((prev) => !prev), [setIsExpanded]);

  return {
    description,
    length,
    isExpanded,
    toggleExpand,
  };
}
