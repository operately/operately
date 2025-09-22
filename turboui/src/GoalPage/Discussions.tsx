import React from "react";

import { GoalPage } from ".";
import { PrimaryButton } from "../Button";
import { InfoCallout } from "../Callouts";
import { DiscussionCard } from "../DiscussionCard";

export function Discussions(props: GoalPage.State) {
  if (props.discussions.length === 0 && !props.canEdit) return null;

  const showNewDiscussionButton = props.canEdit && props.state !== "closed";
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

      <div className="mt-8">
        {isZeroState && <DiscussionsZeroState />}
        {!isZeroState && <DiscussionsList props={props} />}
      </div>
    </div>
  );
}

function DiscussionsList({ props }: { props: GoalPage.State }) {
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
