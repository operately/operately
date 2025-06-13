import React from "react";

import FormattedTime from "@/components/FormattedTime";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { assertPresent } from "@/utils/assertions";
import { SecondaryButton } from "turboui";

import { DisableInEditMode, Title } from "./components";
import { useLoadedData } from "./loader";

export function NextCheckIn() {
  const { goal } = useLoadedData();
  const navigate = useNavigateTo(DeprecatedPaths.goalCheckInNewPath(goal.id!));

  assertPresent(goal.nextUpdateScheduledAt, "nextUpdateScheduledAt must be present in goal");

  return (
    <DisableInEditMode>
      <Title title="Next Check-in" />
      <div className="text-sm mb-1">
        Scheduled for <FormattedTime time={goal.nextUpdateScheduledAt} format="long-date" />
      </div>
      <div className="text-base mb-1">
        <SecondaryButton onClick={navigate} size="xs">
          Check-in Now
        </SecondaryButton>
      </div>
    </DisableInEditMode>
  );
}
