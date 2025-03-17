import React from "react";

import { Paths } from "@/routes/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { assertPresent } from "@/utils/assertions";
import { PrimaryButton } from "@/components/Buttons";
import FormattedTime from "@/components/FormattedTime";

import { DisableInEditMode, Title } from "./components";
import { useLoadedData } from "./loader";

export function NextCheckIn() {
  const { goal } = useLoadedData();
  const navigate = useNavigateTo(Paths.goalCheckInNewPath(goal.id!));

  assertPresent(goal.nextUpdateScheduledAt, "nextUpdateScheduledAt must be present in goal");

  return (
    <DisableInEditMode>
      <Title title="Next Check-in" />
      <div className="text-sm mb-1">
        Scheduled for <FormattedTime time={goal.nextUpdateScheduledAt} format="long-date" />
      </div>
      <div className="text-base mb-1">
        <PrimaryButton onClick={navigate} size="xs">
          Check-in Now
        </PrimaryButton>
      </div>
    </DisableInEditMode>
  );
}
