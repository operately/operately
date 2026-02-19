import React from "react";

import { ProjectPage } from ".";
import { PrimaryButton } from "../Button";
import { InfoCallout } from "../Callouts";
import { DiscussionCard } from "../DiscussionCard";

export function Discussions(props: ProjectPage.State) {
  if (props.discussions.length === 0 && !props.permissions.canEdit) return null;

  const showNewDiscussionButton = props.permissions.canEdit && props.state !== "closed";
  const isZeroState = props.discussions.length === 0 && props.state !== "closed";

  return (
    <div className="p-4 max-w-3xl mx-auto my-6 overflow-auto">
      <div className="flex items-center gap-2 justify-between">
        <div>
          <h2 className="font-bold text-xl">Discussions</h2>
        </div>

        {showNewDiscussionButton && (
          <PrimaryButton linkTo={props.newDiscussionLink} size="xs" testId="start-discussion">
            Start discussion
          </PrimaryButton>
        )}
      </div>

      <div className="mt-8" data-test-id="project-discussions-section">
        {isZeroState && <DiscussionsZeroState />}
        {!isZeroState && <DiscussionsList props={props} />}
      </div>
    </div>
  );
}

function DiscussionsList({ props }: { props: ProjectPage.Props }) {
  return (
    <div>
      {props.discussions.map((discussion) => (
        <DiscussionCard
          key={discussion.id}
          discussion={discussion}
          mentionedPersonLookup={props.richTextHandlers.mentionedPersonLookup}
        />
      ))}
    </div>
  );
}

function DiscussionsZeroState() {
  return (
    <InfoCallout
      message="No discussions yet"
      description="Start a discussion to share updates, ask questions, or get feedback from your team."
    />
  );
}
