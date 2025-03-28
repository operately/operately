import React from "react";

import { filterPossibleParentGoals, Goal } from "@/models/goals";
import { IconBuildingEstate, IconTarget } from "@tabler/icons-react";

import classNames from "classnames";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Forms from "@/components/Forms";

import { GhostLink } from "@/components/Link/GhostList";
import { useIsViewMode } from "@/components/Pages";
import { Paths } from "@/routes/paths";
import { useLoadedData } from "./loader";
import { SecondaryButton } from "@/components/Buttons";
import { GoalSelector } from "@/features/goals/GoalTree/GoalSelector";

export function ParentGoal() {
  const isViewMode = useIsViewMode();

  if (isViewMode) return <ViewParentGoal />;
  return <EditParentGoal />;
}

function EditParentGoal() {
  const { goals, goal } = useLoadedData();
  const [isOpen, setIsOpen] = React.useState(false);
  const [_, setParentGoal] = Forms.useFieldValue<Goal | null>("parentGoal");

  const options = React.useMemo(() => filterPossibleParentGoals(goals, goal), [goal, goals]);

  const contentClass = classNames(
    "max-h-[400px] bg-surface-base rounded-md overflow-scroll",
    "px-2 shadow-lg ring-1 transition ring-surface-outline",
    "focus:outline-none",
  );

  const handleSelect = (selectedGoal: Goal) => {
    setParentGoal(selectedGoal);
    setIsOpen(false);
  };

  return (
    <DropdownMenu.Root open={isOpen} modal={false}>
      <DropdownMenu.Trigger>
        <div className="flex items-center gap-1">
          <GoalIcon />
          <GoalName />
          <SecondaryButton size="xxs" onClick={() => setIsOpen(true)} spanButton>
            Edit
          </SecondaryButton>
        </div>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content side="bottom" align="start" sideOffset={10} avoidCollisions={false}>
          <DropdownMenu.Arrow />
          <div className={contentClass}>
            <GoalSelector goals={options} onSelect={handleSelect} allowCompanyWide />
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function ViewParentGoal() {
  return (
    <div className="flex items-center gap-1">
      <GoalIcon />
      <GoalName link />
    </div>
  );
}

function GoalIcon() {
  const [parentGoal] = Forms.useFieldValue<Goal | null>("parentGoal");

  if (!parentGoal) {
    return <IconBuildingEstate size={14} />;
  }
  return <IconTarget size={14} className="text-red-500" />;
}

function GoalName({ link }: { link?: boolean }) {
  const [parentGoal] = Forms.useFieldValue<Goal | null>("parentGoal");

  if (!parentGoal) {
    return <div className="font-medium text-sm text-content-dimmed">Company-wide goal</div>;
  }
  if (!link) {
    return <div className="font-medium text-sm text-content-dimmed">{parentGoal.name}</div>;
  }
  return <GhostLink to={Paths.goalPath(parentGoal.id!)} text={parentGoal.name!} dimmed size="sm" />;
}
