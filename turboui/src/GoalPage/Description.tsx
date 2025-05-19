import * as React from "react";
import { GoalPage } from ".";
import { SecondaryButton } from "../Button";
import RichContent, { countCharacters, shortenContent } from "../RichContent";
import { MentionedPersonLookupFn } from "../RichEditor";
import { SectionHeader } from "./SectionHeader";

export function Description(props: GoalPage.Props) {
  if (!props.description && !props.canEdit) return null;

  return (
    <div>
      <SectionHeader
        title="Goal Description"
        buttons={<SecondaryButton size="xxs">{props.description ? "Edit" : "Write"}</SecondaryButton>}
        showButtons={props.canEdit}
      />

      {props.description ? (
        <DescriptionContent description={props.description!} mentionedPersonLookup={props.mentionedPersonLookup} />
      ) : (
        <DescriptionZeroState />
      )}
    </div>
  );
}

function DescriptionContent({
  description,
  mentionedPersonLookup,
}: {
  description: string;
  mentionedPersonLookup: MentionedPersonLookupFn;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const length = React.useMemo(() => {
    return description ? countCharacters(description, { skipParse: true }) : 0;
  }, [description]);

  const displayedDescription = React.useMemo(() => {
    if (length <= 200) {
      return description;
    } else if (isExpanded) {
      return description;
    } else {
      return shortenContent(description, 200, { suffix: "...", skipParse: true });
    }
  }, [description, length, isExpanded]);

  console.log(displayedDescription);

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
