import React from "react";

import { filterPossibleParentGoals } from "@/models/goals";
import { IconBuildingEstate, IconTarget } from "@tabler/icons-react";

import Forms from "@/components/Forms";

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
  const { goals, goal } = useLoadedData();
  const options = React.useMemo(() => filterPossibleParentGoals(goals, goal), [goal, goals]);

  return (
    <div className="mb-1">
      <Forms.FieldGroup>
        <Forms.SelectGoal field="parentGoal" goals={options} required={false} allowCompanyWide />
      </Forms.FieldGroup>
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
        <div className="font-medium text-sm text-content-dimmed">Company-wide goal</div>
      </div>
    );
}
