import React from "react";
import classnames from "classnames";

import Avatar from "@/components/Avatar";
import { GhostButton } from "@/components/Button";
import { GroupPageNavigation } from "@/components/GroupPageNavigation";
import { Link } from "@/components/Link";
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

      <GoalList goals={goals} />
    </>
  );
}

function GoalList({ goals }: { goals: Goals.Goal[] }) {
  return (
    <div className="">
      {goals
        .filter((goal) => !goal.isArchived)
        .map((goal) => {
          return <GoalItem goal={goal} key={goal.id} />;
        })}
    </div>
  );
}

function GoalItem({ goal }: { goal: Goals.Goal }) {
  const path = createPath("goals", goal.id);
  const className = classnames("py-5", "bg-surface", "flex flex-col", "border-t last:border-b border-stroke-base");

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-ellipsis font-bold">
            <Link to={path} underline={false}>
              {goal.name}
            </Link>
          </div>

          {goal.targets!.map((target) => (
            <div key={target!.id} className="text-sm flex items-center gap-1">
              <div className="text-ellipsis w-96">{target!.name}</div>
              <div className="text-ellipsis w-24 bg-surface-dimmed relative h-2 rounded-lg overflow-none">
                <div className="absolute top-0 left-0 h-full bg-accent-1" style={{ width: "50%" }} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Avatar person={goal.champion!} size={24} />
          <Avatar person={goal.reviewer!} size={24} />
        </div>
      </div>
    </div>
  );
}
