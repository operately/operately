import React from "react";

import { Goal } from "@/models/goals";
import { IconBuildingEstate, IconTarget } from "@tabler/icons-react";

import { GoalSelectorDropdown } from "@/features/goals/GoalTree/GoalSelectorDropdown";
import { useFieldError, useFieldValue } from "@/components/Forms/FormContext";
import { GhostLink } from "@/components/Link/GhostList";
import { useIsViewMode } from "@/components/Pages";
import { Paths } from "@/routes/paths";

import { useLoadedData } from "./loader";

export function ParentGoal() {
  const isViewMode = useIsViewMode();

  if (isViewMode) return <ViewParentGoal />;
  return <EditParentGoal />;
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
