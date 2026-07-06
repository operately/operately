import React from "react";

import * as Pages from "@/components/Pages";

import { useForm, Form as CheckInForm } from "@/features/goals/GoalCheckIn";
import { useLoadedData } from "./loader";
import { assertPresent } from "@/utils/assertions";
import { displayDate } from "turboui";
import { compareIds } from "@/routes/paths";
import { isWithinTimeframe } from "@/utils/time";

export function Form() {
  const { update, goal } = useLoadedData();

  assertPresent(update.insertedAt, "insertedAt must be present in update");

  const mode = Pages.useIsViewMode() ? "view" : "edit";
  const allowFullEdit =
    update.state === "draft" ||
    (goal.lastCheckInId
      ? compareIds(goal.lastCheckInId, update.id) && isWithinTimeframe(displayDate(update), 72)
      : false);
  const form = useForm({ mode: "edit", goal, update });

  return (
    <CheckInForm form={form} goal={goal} mode={mode} allowFullEdit={allowFullEdit} isDraft={update.state === "draft"} />
  );
}
