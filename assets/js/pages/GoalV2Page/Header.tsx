import React from "react";

import { IconBuildingEstate, IconTarget } from "@tabler/icons-react";

import Forms from "@/components/Forms";
import { GhostLink } from "@/components/Link/GhostList";
import { useIsViewMode } from "@/components/Pages";
import { GoalStatusBadge } from "@/features/goals/GoalStatusBadge";
import { GoalSelectorDropdown } from "@/features/goals/GoalTree/GoalSelectorDropdown";
import { Paths } from "@/routes/paths";

import { useLoadedData } from "./loader";
import { useFieldError, useFieldValue } from "@/components/Forms/FormContext";
import { Goal } from "@/models/goals";

export function Header() {
  const isViewMode = useIsViewMode();

  if (isViewMode)
    return (
      <div>
        <ViewParentGoal />
        <ViewTitle />
      </div>
    );
  else
    return (
      <div>
        <EditParentGoal />
        <EditTitle />
      </div>
    );
}

function ViewTitle() {
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

function EditTitle() {
  return (
    <Forms.FieldGroup>
      <Forms.TitleInput field="name" />
    </Forms.FieldGroup>
  );
}

function EditParentGoal() {
  const { goals } = useLoadedData();
  const [parentGoal, setParentGoal] = useFieldValue<Goal>("parentGoal");
  const error = useFieldError("parentGoal");

  return (
    <div className="mb-1">
      <GoalSelectorDropdown
        selected={parentGoal}
        goals={goals}
        onSelect={(goal) => setParentGoal(goal)}
        error={!!error}
      />
    </div>
  );
}

function ViewParentGoal() {
  const { goal } = useLoadedData();

  if (goal.parentGoal)
    return (
      <div className="flex items-center gap-1">
        <IconTarget size={14} className="text-red-500" />
        <GhostLink to={Paths.goalPath(goal.parentGoal.id!)} text={goal.parentGoal.name!} dimmed size="sm" />
      </div>
    );
  else
    return (
      <div className="flex items-center gap-1">
        <IconBuildingEstate size={14} />
        <div className="mt-1 font-medium text-sm text-content-dimmed">Company-wide goal</div>
      </div>
    );
}
