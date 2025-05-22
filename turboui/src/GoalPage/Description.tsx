import * as React from "react";
import { GoalPage } from ".";
import { PrimaryButton, SecondaryButton } from "../Button";
import RichContent, { countCharacters, shortenContent } from "../RichContent";
import { Editor, MentionedPersonLookupFn, useEditor } from "../RichEditor";
import { SectionHeader } from "./SectionHeader";

export function Description(props: GoalPage.Props) {
  const [content, setContent] = React.useState<string | null>(props.description || null);

  const [mode, setMode] = React.useState<"view" | "edit" | "zero">(
    !props.description && !props.canEdit ? "zero" : "edit",
  );

  const save = React.useCallback(
    (content: string) => {
      if (content === null) {
        setMode("zero");
      } else {
        setContent(content);
        setMode("view");
      }
      props.description = content;
    },
    [props],
  );

  const cancel = React.useCallback(() => {
    setMode("view");
  }, []);

  if (!props.description && !props.canEdit) return null;

  const editButton = (
    <SecondaryButton size="xxs" onClick={() => setMode("edit")}>
      {props.description ? "Edit" : "Write"}
    </SecondaryButton>
  );

  return (
    <div>
      <SectionHeader title="Goal Description" buttons={editButton} showButtons={props.canEdit && mode !== "edit"} />

      {mode === "view" && <DescriptionContent content={content} mentionedPersonLookup={props.mentionedPersonLookup} />}
      {mode === "zero" && <DescriptionZeroState />}
      {mode === "edit" && (
        <DescriptionEditor
          content={content}
          save={save}
          cancel={cancel}
          mentionedPersonLookup={props.mentionedPersonLookup}
          peopleSearch={props.peopleSearch}
        />
      )}
    </div>
  );
}

function DescriptionContent({
  content,
  mentionedPersonLookup,
}: {
  content: string | null;
  mentionedPersonLookup: MentionedPersonLookupFn;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const length = React.useMemo(() => {
    return content ? countCharacters(content, { skipParse: true }) : 0;
  }, [content]);

  const displayedDescription = React.useMemo(() => {
    if (length <= 200) {
      return content;
    } else if (isExpanded) {
      return content;
    } else {
      return shortenContent(content!, 200, { suffix: "...", skipParse: true });
    }
  }, [content, length, isExpanded]);

  return (
    <div className="mt-2">
      <RichContent content={displayedDescription} mentionedPersonLookup={mentionedPersonLookup} />

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

function DescriptionZeroState() {
  return (
    <div className="mb-1">
      <div className="text-content-dimmed text-sm">Describe the goal to provide context and clarity.</div>
    </div>
  );
}

function DescriptionEditor({
  content,
  save,
  cancel,
  mentionedPersonLookup,
  peopleSearch,
}: {
  content: string | null;
  save: (content: string) => void;
  cancel: () => void;
  mentionedPersonLookup: MentionedPersonLookupFn;
  peopleSearch: GoalPage.Props["peopleSearch"];
}) {
  const editorState = useEditor({
    content: content,
    autoFocus: true,
    editable: true,
    mentionedPersonLookup: mentionedPersonLookup,
    peopleSearch: peopleSearch,
  });

  return (
    <div className="mt-2">
      <Editor editor={editorState} />
      <div className="flex gap-2 mt-2">
        <PrimaryButton size="xs" onClick={() => save(editorState.editor.getJSON())}>
          Save
        </PrimaryButton>
        <SecondaryButton size="xs" onClick={cancel}>
          Cancel
        </SecondaryButton>
      </div>
    </div>
  );
}
