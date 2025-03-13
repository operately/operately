import React from "react";

import Forms from "@/components/Forms";
import { useIsViewMode } from "@/components/Pages";
import { GoalStatusBadge } from "@/features/goals/GoalStatusBadge";

import { useLoadedData } from "./loader";

export function GoalName() {
  const isViewMode = useIsViewMode();

  if (isViewMode) return <ViewName />;
  return <EditName />;
}

function ViewName() {
  const { goal } = useLoadedData();
  const status = goal.lastCheckIn?.status ?? "on_track";

  return (
    <Forms.FieldGroup>
      <div className="flex items-start gap-2">
        <Forms.TitleInput field="name" readonly />
        <GoalStatusBadge status={status} className="mt-3" />
      </div>
    </Forms.FieldGroup>
  );
}

function EditName() {
  return (
    <Forms.FieldGroup>
      <Forms.TitleInput field="name" />
    </Forms.FieldGroup>
  );
}
