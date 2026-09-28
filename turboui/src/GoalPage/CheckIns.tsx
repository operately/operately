import { useTranslation } from "react-i18next";
import React from "react";
import { GoalPage } from ".";
import { ContentListState } from "../ContentListState";
import { PrimaryButton } from "../Button";
import { CheckInCard } from "../CheckInCard";

export function CheckIns(props: GoalPage.State) {
  const { t } = useTranslation();
  const showCheckInButton = props.permissions.canEdit && props.state !== "closed";

  return (
    <div className="p-4 max-w-3xl mx-auto my-6 overflow-auto">
      <div className="flex items-center gap-2 justify-between">
        <div>
          <h2 className="font-bold text-lg">{t("Check-Ins")}</h2>
          <div className="flex items-center gap-2 text-sm">
            {t("Champions post monthly updates to document progress and share insights.")}
          </div>
        </div>

        {showCheckInButton && (
          <PrimaryButton linkTo={props.newCheckInLink} size="xs" testId="check-in-button">
            {t("Post check-in")}
          </PrimaryButton>
        )}
      </div>

      <div className="mt-8">
        <ContentListState
          name="check-ins"
          loading={props.checkInsLoading}
          error={props.checkInsError}
          onRetry={props.onRetryCheckIns}
        >
          {props.checkIns.map((checkIn) => (
            <CheckInCard
              key={checkIn.id}
              checkIn={checkIn}
              mentionedPersonLookup={props.richTextHandlers.mentionedPersonLookup}
              type="goal"
              formattedTimePreferences={props.formattedTimePreferences}
            />
          ))}
        </ContentListState>
      </div>
    </div>
  );
}
