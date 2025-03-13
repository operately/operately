import React from "react";

import Forms from "@/components/Forms";
import { useIsViewMode } from "@/components/Pages";
import { GoalStatusBadge } from "@/features/goals/GoalStatusBadge";

import { useLoadedData } from "./loader";

export function Header() {
  const { goal } = useLoadedData();
  const isViewMode = useIsViewMode();

  const status = goal.lastCheckIn?.status ?? "on_track";

  return (
    <Forms.FieldGroup>
      <div className="flex items-center gap-2">
        <Forms.TitleInput field="name" readonly={isViewMode} />
        {isViewMode && <GoalStatusBadge status={status} className="mt-1" />}
      </div>
    </Forms.FieldGroup>
  );
}
