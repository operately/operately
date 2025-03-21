import React from "react";

import Forms from "@/components/Forms";
import { useIsViewMode } from "@/components/Pages";
import RichContent, { countCharacters, shortenContent } from "@/components/RichContent";
import { ActionLink } from "@/components/Link";

import { useLoadedData } from "./loader";

const DESCRIPTION_CHAR_LIMIT = 200;

export function Description() {
  const isViewMode = useIsViewMode();

  if (isViewMode) return <ViewDescription />;
  return <EditDescription />;
}

function ViewDescription() {
  const { goal } = useLoadedData();
  const [expanded, setExpanded] = React.useState(false);

  const { length, description } = React.useMemo(
    () => parseDescription(goal.description, expanded),
    [goal.description, expanded],
  );

  if (!description) return null;

  return (
    <div>
      <RichContent jsonContent={description} />
      {length > DESCRIPTION_CHAR_LIMIT && (
        <ActionLink onClick={() => setExpanded(!expanded)} className="text-sm">
          {expanded ? "Collapse" : "Expand"}
        </ActionLink>
      )}
    </div>
  );
}

function EditDescription() {
  const { goal } = useLoadedData();
  const mentionSearchScope = { type: "goal", id: goal.id! } as const;

  return (
    <Forms.FieldGroup>
      <Forms.RichTextArea
        field="description"
        placeholder="Add description..."
        mentionSearchScope={mentionSearchScope}
        height="3rem"
        horizontalPadding=""
        verticalPadding=""
        fontWeight="font-normal"
        hideBorder
        hideToolbar
      />
    </Forms.FieldGroup>
  );
}

function parseDescription(description, expanded: boolean) {
  const length = description ? countCharacters(description) : 0;

  if (length === 0) return { length, description: null };

  if (expanded || length <= DESCRIPTION_CHAR_LIMIT) {
    return { length, description };
  }
  return { length, description: shortenContent(description!, DESCRIPTION_CHAR_LIMIT, { suffix: "..." }) };
}
