import React from "react";
import FormattedTime from "../FormattedTime";
import classNames from "../utils/classnames";

import { GoalPage } from ".";
import { Avatar } from "../Avatar";
import { PrimaryButton } from "../Button";
import { InfoCallout } from "../Callouts";
import { DivLink } from "../Link";
import { Summary } from "../RichContent";
import { CommentCountIndicator } from "../CommentCountIndicator";

export function Discussions(props: GoalPage.State) {
  if (props.discussions.length === 0 && !props.canEdit) return null;

  const showNewDiscussionButton = props.canEdit && props.state !== "closed";
  const isZeroState = props.discussions.length === 0 && props.state !== "closed";

  return (
    <div className="p-4 max-w-3xl mx-auto my-6 overflow-scroll">
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

function DiscussionsList({ props }: { props: GoalPage.Props }) {
  return (
    <div>
      {props.discussions.map((discussion) => (
        <Discussion key={discussion.id} discussion={discussion} mentionedPersonLookup={props.mentionedPersonLookup} />
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

interface DiscussionProps {
  discussion: GoalPage.Discussion;
  mentionedPersonLookup: GoalPage.Props["mentionedPersonLookup"];
}

function Discussion({ discussion, mentionedPersonLookup }: DiscussionProps) {
  const className = classNames(
    "flex gap-4 items-center",
    "py-3 px-3",
    "last:border-b border-t border-stroke-base",
    "cursor-pointer hover:bg-surface-highlight",
  );

  return (
    <DivLink to={discussion.link} className={className}>
      <div className="flex gap-4 flex-1">
        <div className="shrink-0">
          <Avatar person={discussion.author} size="large" />
        </div>

        <div className="flex-1 h-full">
          <div className="font-semibold leading-none mb-1">{discussion.title}</div>
          <div className="break-words">
            <Summary content={discussion.content} characterCount={130} mentionedPersonLookup={mentionedPersonLookup} />
          </div>

          <div className="flex gap-1 mt-1 text-xs">
            <div className="text-sm text-content-dimmed">{discussion.author.fullName}</div>
            <div className="text-sm text-content-dimmed">·</div>
            <div className="text-sm text-content-dimmed">
              <FormattedTime time={discussion.date!} format="relative-weekday-or-date" />
            </div>
          </div>
        </div>
      </div>

      <CommentCountIndicator count={discussion.commentCount} size={28} />
    </DivLink>
  );
}
