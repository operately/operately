import React from "react";

import { PrimaryButton } from "../Button";
import { InfoCallout } from "../Callouts";
import { DiscussionCard } from "../DiscussionCard";
import { TemplateProjectPage } from ".";

export function Discussions({ props, canEdit }: { props: TemplateProjectPage.Props; canEdit: boolean }) {
  if (props.discussions.length === 0 && !canEdit) return null;

  return (
    <div className="p-4 max-w-3xl mx-auto my-6 overflow-auto">
      <div className="flex items-center gap-2 justify-between">
        <h2 className="font-bold text-xl">Discussions</h2>
        {canEdit && props.newDiscussionLink && (
          <PrimaryButton linkTo={props.newDiscussionLink} size="xs" testId="start-template-discussion">
            Start discussion
          </PrimaryButton>
        )}
      </div>

      <div className="mt-8" data-test-id="template-discussions-section">
        {props.discussions.length === 0 ? (
          <InfoCallout
            message="No discussions yet"
            description="Start a discussion to share reusable context, questions, or guidance for this template."
          />
        ) : (
          props.discussions.map((discussion) => (
            <DiscussionCard
              key={discussion.id}
              discussion={{ ...discussion, commentCount: 0 }}
              mentionedPersonLookup={props.richTextHandlers.mentionedPersonLookup}
              formattedTimePreferences={props.formattedTimePreferences}
            />
          ))
        )}
      </div>
    </div>
  );
}
