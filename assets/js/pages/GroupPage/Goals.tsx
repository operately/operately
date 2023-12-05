import React from "react";

import * as Goals from "@/models/goals";

import { GhostButton } from "@/components/Button";
import { Group } from "@/gql/generated";
import { DivLink } from "@/components/Link";
import { createPath } from "@/utils/paths";

export function GoalsSection({ group }: { group: Group }) {
  const newGoalPath = createPath("spaces", group.id, "goals", "new");

  return (
    <div className="mb-8 mt-8">
      <div className="flex items-center gap-4 w-full">
        <div className="text-content-accent font-bold text-lg">Goals</div>
        <div className="h-px bg-surface-outline flex-1"></div>
        <GhostButton type="primary" size="sm" linkTo={newGoalPath} testId="add-goal">
          Add Goal
        </GhostButton>
      </div>

      <div className="flex-1 mt-4">
        <GoalList group={group} />
      </div>
    </div>
  );
}

function GoalList({ group }: { group: Group }) {
  const { data, loading, error } = Goals.useGoals(group.id);

  if (loading) return null;
  if (error) return null;

  return <GoalsGrid goals={data?.goals} />;
}

function GoalsGrid({ goals }: { goals: Goals.Goal[] }) {
  return (
    <div className="grid lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-2 gap-4">
      {goals
        .filter((goal) => !goal.isArchived)
        .map((goal) => {
          return <GoalGridItem goal={goal} key={goal.id} />;
        })}
    </div>
  );
}

function GoalGridItem({ goal }: { goal: Goals.Goal }) {
  const path = createPath("goals", goal.id);

  return (
    <DivLink
      className="bg-surface rounded-lg p-4 flex flex-col gap-2 cursor-pointer shadow hover:shadow-lg overflow-hidden borderb border-surface-outline"
      to={path}
    >
      <div className="flex flex-col justify-between h-28">
        <div>
          <div className="text-ellipsis font-bold">{goal.name}</div>
        </div>

        <div className="flex items-center gap-1"></div>
      </div>
    </DivLink>
  );
}
