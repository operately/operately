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
import { TextTooltip } from "@/components/Tooltip";

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

          <div className="flex flex-col gap-1 mt-1">
            {goal.targets!.map((target, index) => (
              <div key={index} className="text-sm flex items-center gap-1">
                <div className="text-ellipsis w-96">{target!.name}</div>
                <ProgressBar progress={target} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Avatar person={goal.champion!} size={24} />
          <Avatar person={goal.reviewer!} size={24} />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ target }: { target: Goals.Target }) {
  const progress = Math.floor(Math.random() * 100.0);

  let color = "";
  if (progress < 20) color = "bg-yellow-300";
  if (progress >= 40 && progress < 80) color = "bg-yellow-500";
  if (progress >= 70) color = "bg-green-600";

  return (
    <TextTooltip text={"hello"}>
      <div className="text-ellipsis w-20 bg-gray-200 relative h-3 overflow-hidden rounded-sm">
        <div className={"absolute top-0 left-0 h-full" + " " + color} style={{ width: `${progress}%` }} />
      </div>
    </TextTooltip>
  );
}
