import { useTranslation } from "react-i18next";
import React from "react";

import { GoalPage } from ".";
import { ContentListState } from "../ContentListState";
import { PrimaryButton } from "../Button";
import { InfoCallout } from "../Callouts";
import { DiscussionCard } from "../DiscussionCard";

export function Discussions(props: GoalPage.State) {
  const { t } = useTranslation();
  if (
    props.discussions.length === 0 &&
    !props.permissions.canEdit &&
    props.state !== "closed" &&
    !props.discussionsLoading &&
    !props.discussionsError
  )
    return null;

  const showNewDiscussionButton = props.permissions.canEdit && props.state !== "closed";
  const isZeroState = props.discussions.length === 0 && !props.discussionsError;

  return (
    <div className="p-4 max-w-3xl mx-auto my-6 overflow-auto">
      <div className="flex items-center gap-2 justify-between">
        <div>
          <h2 className="font-bold text-xl">{t("Discussions")}</h2>
        </div>

        {showNewDiscussionButton && (
          <PrimaryButton linkTo={props.newDiscussionLink} size="xs" testId="start-discussion">
            {t("Start discussion")}
          </PrimaryButton>
        )}
      </div>

      <div className="mt-8">
        <ContentListState
          name="discussions"
          loading={props.discussionsLoading}
          error={props.discussionsError}
          onRetry={props.onRetryDiscussions}
        >
          {isZeroState && (
            <div data-test-id="discussions-empty-state">
              {props.state === "closed" ? <DiscussionsZeroStateClosed /> : <DiscussionsZeroState />}
            </div>
          )}
          {!isZeroState && <DiscussionsList props={props} />}
        </ContentListState>
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
          formattedTimePreferences={props.formattedTimePreferences}
        />
      ))}
    </div>
  );
}

function DiscussionsZeroState() {
  const { t } = useTranslation();
  return (
    <InfoCallout
      message={t("No discussions yet")}
      description={t("Start a discussion to share updates, ask questions, or get feedback from your team.")}
    />
  );
}

function DiscussionsZeroStateClosed() {
  const { t } = useTranslation();
  return <InfoCallout message={t("No discussions")} description={t("This goal is closed and has no discussions.")} />;
}
