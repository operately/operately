import { useTranslation } from "react-i18next";
import React from "react";
import { GoalPage } from ".";
import { ContentListState } from "../ContentListState";
import { SecondaryButton } from "../Button";
import { MiniWorkMap } from "../MiniWorkMap";
import { SectionHeader } from "./SectionHeader";

export function RelatedWork(props: GoalPage.State) {
  const { t } = useTranslation();
  const spaceProps = "space" in props ? props : null;
  const canAddRelatedWork = props.permissions.canEdit && Boolean(spaceProps);

  if (props.relatedWorkItems.length === 0 && !canAddRelatedWork && !props.relatedWorkLoading && !props.relatedWorkError)
    return null;

  const buttons =
    canAddRelatedWork && spaceProps ? (
      <div className="flex items-center gap-2">
        <SecondaryButton size="xxs" linkTo={spaceProps.addSubgoalLink} testId="add-subgoal">
          {t("Add goal")}
        </SecondaryButton>
        <SecondaryButton size="xxs" linkTo={spaceProps.addSubprojectLink}>
          {t("Add project")}
        </SecondaryButton>
      </div>
    ) : null;

  return (
    <div data-test-id="related-work-section">
      <SectionHeader title={t("Subgoals & Projects")} buttons={buttons} showButtons={canAddRelatedWork} />

      <ContentListState
        name="related-work"
        loading={props.relatedWorkLoading}
        error={props.relatedWorkError}
        onRetry={props.onRetryRelatedWork}
      >
        {props.relatedWorkItems.length > 0 ? (
          <RelatedWorkContent {...props} />
        ) : (
          !props.relatedWorkError && <RelatedWorkZeroState />
        )}
      </ContentListState>
    </div>
  );
}

function RelatedWorkContent(props: GoalPage.State) {
  return (
    <div className="mt-4">
      <MiniWorkMap items={props.relatedWorkItems} />
    </div>
  );
}

function RelatedWorkZeroState() {
  const { t } = useTranslation();
  return (
    <div className="mt-1">
      <div className="text-content-dimmed text-sm">
        {t("Break down the work on this goal into subgoals and projects.")}
      </div>
    </div>
  );
}
