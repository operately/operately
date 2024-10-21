import React from "react";

import classNames from "classnames";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { includesId, Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { ProgressBar } from "@/components/ProgressBar";
import { MiniPieChart } from "@/components/MiniPieChart";
import { SecondaryButton } from "@/components/Buttons";

import { GoalNode } from "../tree";
import { useExpandable } from "../context/Expandable";

export function GoalDetails({ node }: { node: GoalNode }) {
  return (
    <div className="pl-[42px]">
      <GoalSuccessConditions node={node} />
    </div>
  );
}

export function GoalProgressBar({ node }: { node: GoalNode }) {
  assertPresent(node.goal.progressPercentage, "progressPercentage must be present in goal");

  return <ProgressBar percentage={node.goal.progressPercentage} className="ml-2" />;
}

export function ExpandGoalSuccessConditions({ node }: { node: GoalNode }) {
  const { goalExpanded, toggleGoalExpanded } = useExpandable();

  return (
    <div
      onClick={() => toggleGoalExpanded(node.goal.id!)}
      className="ml-2 h-[20px] w-[20px] rounded-full border-2 border-surface-outline flex items-center justify-center cursor-pointer"
    >
      {includesId(goalExpanded, node.goal.id) ? (
        <IconMinus size={12} stroke={3} className="border-surface-outline shrink-0" />
      ) : (
        <IconPlus size={12} stroke={3} className="border-surface-outline shrink-0" />
      )}
    </div>
  );
}

export function GoalActions({ hovered, node }: { hovered: boolean; node: GoalNode }) {
  const containerClasses = classNames(
    "ml-2 flex gap-2 items-center",
    hovered ? "opacity-100 transition-opacity duration-300" : "opacity-0",
  );
  const newGoalPath = Paths.goalNewPath({ parentGoalId: node.goal.id! });
  const newProjectPath = Paths.newProjectPath();

  return (
    <div className={containerClasses}>
      <SecondaryButton linkTo={newGoalPath} size="xxs">
        Add sub-goal
      </SecondaryButton>
      <SecondaryButton linkTo={newProjectPath} size="xxs">
        Create project
      </SecondaryButton>
    </div>
  );
}

function GoalSuccessConditions({ node }: { node: GoalNode }) {
  const { goalExpanded } = useExpandable();
  assertPresent(node.goal.targets, "targets must be present in goal");

  if (!includesId(goalExpanded, node.goal.id)) return <></>;

  return (
    <div>
      {node.goal.targets.map((t) => {
        const total = t.to! - t.from!;
        const completed = t.value! - t.from!;

        return (
          <div key={t.id} className="flex items-center gap-2 text-content-dimmed">
            <MiniPieChart total={total} completed={completed} />
            {t.name}
          </div>
        );
      })}
    </div>
  );
}
