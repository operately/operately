import React from "react";

import * as Goals from "@/models/goals";

import { GhostButton } from "@/components/Button";
import { Group } from "@/gql/generated";
import Avatar from "@/components/Avatar";
import { DivLink } from "@/components/Link";

export function GoalsSection({ group }: { group: Group }) {
  return (
    <div className="mb-8 mt-8">
      <div className="flex items-center gap-4 w-full">
        <div className="text-content-accent font-bold text-lg">Goals</div>
        <div className="h-px bg-surface-outline flex-1"></div>
        <GhostButton type="primary" size="sm" linkTo={`/spaces/${group.id}/goals/new`} testId="add-project">
          Add Goal
        </GhostButton>
      </div>

      <div className="flex-1 mt-4">
        <GoalList group={group} />
      </div>
    </div>
  );
}

export function GoalList({ group }: { group: Group }) {
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
  return (
    <DivLink
      className="bg-surface rounded-lg p-4 flex flex-col gap-2 cursor-pointer shadow hover:shadow-lg overflow-hidden borderb border-surface-outline"
      to={`/spaces/${goal.spaceId}/goals/${goal.id}`}
    >
      <div className="flex flex-col justify-between h-28">
        <div>
          <div className="text-ellipsis font-bold">{goal.name}</div>
        </div>

        <div className="flex items-center gap-1">
          {goal.contributors!.map((contributor) => (
            <Avatar key={contributor!.id} person={contributor!.person} size="tiny" />
          ))}
        </div>
      </div>
    </DivLink>
  );
}
