import React from "react";

import Avatar from "@/components/Avatar";
import { GhostButton } from "@/components/Button";
import { GroupPageNavigation } from "@/components/GroupPageNavigation";
import { DivLink } from "@/components/Link";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as Companies from "@/models/companies";
import { createPath } from "@/utils/paths";
import { useLoadedData } from "./loader";
import { ComingSoonBadge } from "@/components/ComingSoonBadge";

export function Page() {
  const { group } = useLoadedData();

  return (
    <Pages.Page title={group.name}>
      <Paper.Root size="large">
        <Paper.Body minHeight="500px">
          <GroupPageNavigation groupId={group.id} groupName={group.name} activeTab="goals" />
          <Content />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Content() {
  const { group, goals, company } = useLoadedData();

  if (!Companies.hasFeature(company, "goals")) return <ComingSoonBadge />;

  const newGoalPath = createPath("spaces", group.id, "goals", "new");

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div className="font-extrabold text-3xl">Goals</div>
        <GhostButton type="primary" size="sm" linkTo={newGoalPath} testId="add-goal">
          Add Goal
        </GhostButton>
      </div>

      <GoalsGrid goals={goals} />
    </>
  );
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
      className="bg-surface rounded-lg p-4 flex flex-col gap-2 cursor-pointer shadow hover:shadow-lg overflow-hidden border border-stroke-base"
      to={path}
    >
      <div className="flex flex-col justify-between h-28">
        <div className="text-ellipsis font-bold">{goal.name}</div>

        <div className="flex items-center gap-1">
          <Avatar person={goal.champion!} size="tiny" />
          <Avatar person={goal.reviewer!} size="tiny" />
        </div>
      </div>
    </DivLink>
  );
}
