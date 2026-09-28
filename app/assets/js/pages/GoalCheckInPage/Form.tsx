import { useTaskList } from "@/models/richContent/taskListLifecycle";
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
  const mode = Pages.useIsViewMode() ? "view" : "edit";

  // Each edit session starts from current content; refreshes during editing keep unsaved changes.
  return <FormContent key={`${update.id}:${mode}`} update={update} goal={goal} mode={mode} />;
}

function FormContent({
  update,
  goal,
  mode,
}: Pick<ReturnType<typeof useLoadedData>, "update" | "goal"> & { mode: "view" | "edit" }) {
  const taskList = useTaskList({
    resourceType: "goal_check_in",
    resourceId: update.id,
    field: "message",
    canEdit: update.permissions?.canEdit ?? false,
  });

  assertPresent(update.insertedAt, "insertedAt must be present in update");

  const isUnpublished = update.state === "draft" || update.state === "scheduled";
  const allowFullEdit =
    isUnpublished ||
    (goal.lastCheckInId
      ? compareIds(goal.lastCheckInId, update.id) && isWithinTimeframe(displayDate(update), 72)
      : false);
  const form = useForm({ mode: "edit", goal, update });

  return (
    <CheckInForm
      taskList={taskList}
      taskListContent={update.message ? JSON.parse(update.message) : undefined}
      form={form}
      goal={goal}
      mode={mode}
      allowFullEdit={allowFullEdit}
      isUnpublished={isUnpublished}
    />
  );
}
