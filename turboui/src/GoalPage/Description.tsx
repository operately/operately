import * as React from "react";
import { GoalPage } from ".";
import { SecondaryButton } from "../Button";
import { truncate } from "../utils/strings";
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

      {props.description ? <DescriptionContent description={props.description!} /> : <DescriptionZeroState />}
    </div>
  );
}

function DescriptionContent({ description }: { description: string }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="mt-2">
      <div className="whitespace-pre-wrap">{isExpanded ? description : truncate(description!, 200)}</div>
      {description!.length > 200 && (
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
