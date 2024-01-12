import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Icons from "@tabler/icons-react";

import { useLoadedData, useTimeframeControles } from "./loader";
import { Link } from "@/components/Link";

import Avatar from "@/components/Avatar";
import { FilledButton } from "@/components/Button";

export function Page() {
  const { company, goals } = useLoadedData();

  const groups = Goals.groupBySpace(goals);

  return (
    <Pages.Page title={"Goals"}>
      <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8 mt-16">
        <div className="flex gap-4 -mb-8">
          <FilledButton linkTo={"/goals/new"}>Add Goal</FilledButton>
        </div>

        <TimeframeSelector />
        <h1 className="text-3xl font-bold text-center mt-2 mb-16">Goals in {company.name}</h1>

        <GoalGroups groups={groups} />
      </div>
    </Pages.Page>
  );
}

function TimeframeSelector() {
  const [timeframe, next, prev] = useTimeframeControles();

  return (
    <div className="flex items-center justify-center gap-4">
      <Icons.IconChevronLeft onClick={prev} className="cursor-pointer" />
      <span className="font-medium text-content-accent leading-loose">{timeframe}</span>
      <Icons.IconChevronRight onClick={next} className="cursor-pointer" />
    </div>
  );
}

function GoalGroups({ groups }) {
  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <GoalGroup key={group.space.id} group={group} />
      ))}
    </div>
  );
}

function GoalGroup({ group }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="uppercase text-xs font-medium tracking-wide text-center flex items-center gap-4 w-full">
        <div className="h-px bg-stroke-base w-full" />
        {group.space.name}
        <div className="h-px bg-stroke-base w-full" />
      </div>
      <GoalList goals={group.goals} />
    </div>
  );
}

function GoalList({ goals }) {
  return (
    <div className="flex flex-col gap-4">
      {goals.map((goal) => (
        <GoalListItem key={goal.id} goal={goal} />
      ))}
    </div>
  );
}

function GoalListItem({ goal }: { goal: Goals.Goal }) {
  return (
    <div className="px-4 py-4 bg-surface border border-stroke-base shadow rounded">
      <div className="text-xs text-content-accent font-medium">{goal.timeframe}</div>
      <div className="font-bold mb-2">
        <Link underline={false} to={`/goals/${goal.id}`}>
          {goal.name}
        </Link>
      </div>

      <div className="">
        <TargetList targets={goal.targets!} />
      </div>

      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-1">
          <Avatar person={goal.champion!} size={20} />
          <Avatar person={goal.reviewer!} size={20} />
        </div>
      </div>
    </div>
  );
}

function TargetList({ targets }: { targets: Goals.Target[] }) {
  return (
    <ul>
      {targets.map((target) => (
        <TargetListItem key={target.name} target={target} />
      ))}
    </ul>
  );
}

function TargetListItem({ target }: { target: Goals.Target }) {
  return (
    <div className="flex items-center justify-between py-px">
      <div className="font-medium text-sm">{target.name}</div>
      <ProgressBar target={target} />
    </div>
  );
}

function ProgressBar({ target }: { target: Goals.Target }) {
  const from = target!.from!;
  const to = target!.to!;
  const value = target!.value!;

  let progress = Math.round(((value - from) / (to - from)) * 100);
  if (progress < 0) progress = 0;
  if (progress > 100) progress = 100;

  let color = "";
  if (progress < 20) color = "bg-yellow-300";
  if (progress >= 40 && progress < 80) color = "bg-yellow-500";
  if (progress >= 70) color = "bg-green-600";

  return (
    <div className="text-ellipsis w-40 bg-gray-200 relative h-3 overflow-hidden rounded-sm">
      <div className={"absolute top-0 left-0 h-full" + " " + color} style={{ width: `${progress}%` }} />
    </div>
  );
}
