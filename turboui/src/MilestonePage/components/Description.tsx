import React, { useMemo, useState, useEffect, useCallback } from "react";
import * as Types from "../../TaskBoard/types";
import { PrimaryButton, SecondaryButton } from "../../Button";
import RichContent, { countCharacters, isContentEmpty, shortenContent } from "../../RichContent";
import { Editor, useEditor } from "../../RichEditor";

interface Props {
  description?: any;
  onDescriptionChange?: (newDescription: any) => Promise<boolean>;
  mentionedPersonLookup?: (id: string) => Types.Person | undefined;
  peopleSearch?: (params: { query: string }) => Promise<Types.Person[]>;
  canEdit: boolean;
}

export function MilestoneDescription({
  description,
  onDescriptionChange,
  mentionedPersonLookup,
  peopleSearch,
  canEdit,
}: Props) {
  const descriptionState = useMilestoneDescriptionState({
    description,
    onDescriptionChange,
    mentionedPersonLookup,
    peopleSearch,
  });

  if (descriptionState.mode === "zero" && !canEdit) return null;

  if (descriptionState.mode === "zero") {
    return (
      <div>
        <button
          onClick={descriptionState.startEdit}
          className="text-content-dimmed hover:text-content-base text-sm transition-colors cursor-pointer"
        >
          Add details about this milestone...
        </button>
      </div>
    );
  }

  const editButton = (
    <SecondaryButton size="xxs" onClick={descriptionState.startEdit}>
      Edit
    </SecondaryButton>
  );

  return (
    <div>
      <SectionHeader title="Notes" buttons={editButton} showButtons={canEdit && descriptionState.mode !== "edit"} />

      {descriptionState.mode === "view" && <MilestoneDescriptionContent state={descriptionState} />}
      {descriptionState.mode === "edit" && <MilestoneDescriptionEditor state={descriptionState} />}
    </div>
  );
}

function SectionHeader({
  title,
  buttons,
  showButtons,
}: {
  title: string;
  buttons?: React.ReactNode;
  showButtons?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="font-bold">{title}</h2>
      {showButtons && buttons}
    </div>
  );
}

function MilestoneDescriptionContent({ state }: { state: MilestoneDescriptionState }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const length = useMemo(() => {
    return state.description ? countCharacters(state.description, { skipParse: true }) : 0;
  }, [state.description]);

  const displayedDescription = useMemo(() => {
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
      <RichContent
        content={displayedDescription}
        mentionedPersonLookup={async (id: string) => {
          const person = state.mentionedPersonLookup?.(id);
          if (!person) return null;
          return {
            id: person.id,
            fullName: person.fullName,
            avatarUrl: person.avatarUrl,
            title: "",
            profileLink: `/people/${person.id}`,
          };
        }}
      />

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

function MilestoneDescriptionEditor({ state }: { state: MilestoneDescriptionState }) {
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

interface MilestoneDescriptionState {
  description: string | null;
  mode: "view" | "edit" | "zero";
  setMode: React.Dispatch<React.SetStateAction<"view" | "edit" | "zero">>;
  setDescription: React.Dispatch<React.SetStateAction<string | null>>;
  editor: ReturnType<typeof useEditor>;
  mentionedPersonLookup?: (id: string) => Types.Person | undefined;
  startEdit: () => void;
  save: () => void;
  cancel: () => void;
}

function useMilestoneDescriptionState({
  description: initialDescription,
  onDescriptionChange,
  mentionedPersonLookup,
  peopleSearch,
}: {
  description?: any;
  onDescriptionChange?: (newDescription: any) => Promise<boolean>;
  mentionedPersonLookup?: (id: string) => Types.Person | undefined;
  peopleSearch?: (params: { query: string }) => Promise<Types.Person[]>;
}): MilestoneDescriptionState {
  const initialMode = isContentEmpty(initialDescription) ? "zero" : "view";

  const [description, setDescription] = useState<string | null>(initialDescription || null);
  const [mode, setMode] = useState<"view" | "edit" | "zero">(initialMode);

  useEffect(() => {
    setDescription(initialDescription || null);
  }, [initialDescription]);

  // Convert TaskBoard Person to RichEditor Person format
  const editorMentionLookup = async (id: string) => {
    const person = mentionedPersonLookup?.(id);
    if (!person) return null;
    return {
      id: person.id,
      fullName: person.fullName,
      avatarUrl: person.avatarUrl,
      title: "", // TaskBoard Person doesn't have title
      profileLink: `/people/${person.id}`, // Generate profile link
    };
  };

  // Convert TaskBoard peopleSearch to RichEditor format
  const editorPeopleSearch = async (params: { query: string }) => {
    if (!peopleSearch) return [];
    const people = await peopleSearch(params);
    return people.map((person) => ({
      id: person.id,
      fullName: person.fullName,
      avatarUrl: person.avatarUrl,
      title: "", // TaskBoard Person doesn't have title
      profileLink: `/people/${person.id}`, // Generate profile link
    }));
  };

  const editor = useEditor({
    content: initialDescription,
    editable: true,
    placeholder: "Describe the milestone...",
    mentionedPersonLookup: editorMentionLookup,
    peopleSearch: editorPeopleSearch,
  });

  const save = useCallback(async () => {
    if (!onDescriptionChange) return;

    const content = editor.getJson();
    const success = await onDescriptionChange(content);

    if (success) {
      setDescription(content);

      if (isContentEmpty(content)) {
        setMode("zero");
      } else {
        setMode("view");
      }
    }
  }, [editor, setDescription, setMode, onDescriptionChange]);

  const cancel = useCallback(() => {
    if (isContentEmpty(description)) {
      setMode("zero");
    } else {
      setMode("view");
    }
  }, [setMode, description]);

  const startEdit = useCallback(() => {
    editor.setContent(initialDescription);
    editor.setFocused(true);
    setMode("edit");
  }, [setMode, editor, initialDescription]);

  return {
    description,
    mode,
    editor,
    mentionedPersonLookup,
    startEdit,
    setMode,
    setDescription,
    save,
    cancel,
  };
}
