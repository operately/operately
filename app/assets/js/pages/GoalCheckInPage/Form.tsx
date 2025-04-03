import React from "react";

import * as Pages from "@/components/Pages";

import { useForm, Form as CheckInForm } from "@/features/goals/GoalCheckIn";
import { useLoadedData } from "./loader";
import { assertPresent } from "@/utils/assertions";
import { compareIds } from "@/routes/paths";
import { isWithinTimeframe } from "@/utils/time";

export function Form() {
  const { update, goal } = useLoadedData();

  assertPresent(goal.lastCheckInId, "lastCheckInId must be present in update");
  assertPresent(update.insertedAt, "insertedAt must be present in update");

  const mode = Pages.useIsViewMode() ? "view" : "edit";
  const allowFullEdit = compareIds(goal.lastCheckInId, update.id) && isWithinTimeframe(update.insertedAt, 72);
  const form = useForm({ mode: "edit", goal, update });

  return <CheckInForm form={form} goal={goal} mode={mode} allowFullEdit={allowFullEdit} />;
}
