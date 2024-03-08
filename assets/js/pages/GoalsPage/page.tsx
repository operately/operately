import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";

import { useLoadedData, useTimeframeControles } from "./loader";
import { Link } from "@/components/Link";

import Avatar from "@/components/Avatar";
import { FilledButton } from "@/components/Button";
import classNames from "classnames";

export function Page() {
  const { company, goals } = useLoadedData();

  const groups = Goals.groupBySpace(goals);

  return (
    <Pages.Page title={"Goals"}>
      <Paper.Root size="large" fluid>
        <Paper.Body>
          <CompanyGoals />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
// <div className="flex gap-4 -mb-8">
//   <FilledButton linkTo={"/goals/new"}>Add Goal</FilledButton>
// </div>

// <TimeframeSelector />
// <h1 className="text-3xl font-bold text-center mt-2 mb-16">Goals in {company.name}</h1>
// <div className="font-semibold mb-4 text-xl">Company Goals</div>

// <div className="grid grid-cols-3 gap-4">
//   {companyGoals.map((goal, index) => (
//     <GoalListItem2 key={goal.id} goal={goal} selected={index === 0} />
//   ))}
// </div>

import { GoalItem } from "./GoalItem";

function CompanyGoals() {
  const { goals } = useLoadedData();
  const companyGoals = goals.filter((goal) => goal.space.isCompanySpace);

  const [openGoals, setOpenGoals] = React.useState<string[]>([
    companyGoals[0]!.id,
    companyGoals[3]!.id,
    goals.find((g) => g.id === "a05c270b-c2ca-4d57-ae2d-6e89f181a248")!.id,
  ]);

  const expandedGoal = goals.find((g) => g.id === openGoals[openGoals.length - 1]);

  return (
    <div>
      <div className="flex items-center justify-center">
        <div className="bg-dark-1 text-white-1 rounded-lg px-4 py-3 font-medium">Rendered Text</div>
      </div>

      <div className="-mx-16 my-2">
        <div className="h-3 border-l w-0.5 bg-dark-8 mx-auto mt-2" />
      </div>

      <div className="flex items-center justify-center">
        <div className="bg-dark-3 text-white-1 rounded-lg px-2 py-1 font-medium">Q1 2024</div>
      </div>

      {openGoals.slice(0, -1).map((goalId) => {
        const goal = goals.find((g) => g.id === goalId)!;

        return (
          <>
            <div className="-mx-16 my-2">
              <div className="h-3 border-l w-0.5 bg-dark-8 mx-auto mt-2" />
            </div>

            <div key={goal.id} className="flex items-center justify-center">
              <div className="w-1/4">
                <GoalListItem2 goal={goal} selected={openGoals.includes(goalId)} />
              </div>
            </div>
          </>
        );
      })}

      {expandedGoal && (
        <>
          <div className="-mx-16 my-2">
            <div className="h-3 border-l w-0.5 bg-dark-8 mx-auto mt-2" />
          </div>

          <div className="shadow rounded-lg p-8 border border-accent-1">
            <div className="flex items-start justify-between mb-8">
              <div className="">
                <div className="font-bold text-lg mb-2">{expandedGoal.name}</div>

                <div className="flex items-center gap-1">
                  <Avatar person={expandedGoal.champion!} size={20} />

                  <div className="font-medium text-sm">{expandedGoal?.champion?.fullName}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Icons.IconArrowsMaximize size={20} />
                <Icons.IconX size={20} onClick={() => setOpenGoals(openGoals.slice(0, -1))} />
              </div>
            </div>

            <GoalItem goal={expandedGoal!} form={{ showMilestones: false }} />
          </div>
        </>
      )}
    </div>
  );
}
// <div className="bg-purple-100 p-1 rounded-lg">
//   <Icons.IconTargetArrow className="text-purple-800" size={20} />
// </div>

function GoalListItem2({ goal, selected }: { goal: Goals.Goal; selected?: boolean }) {
  const className = classNames("p-1 rounded-lg shadow bg-surface-dimmed", {
    "border border-accent-1": selected,
    "opacity-30": !selected,
  });

  const bgCardClass = classNames("flex justify-between items-center p-2", {});

  return (
    <div className={className}>
      <div className="p-3 bg-surface gap-4 rounded border border-stroke-base flex flex-col justify-between h-24">
        <div className="font-medium">{goal.name}</div>
      </div>

      <div className={bgCardClass}>
        <div className="flex items-center gap-2">
          <Avatar person={goal.champion!} size={20} />
          <div>
            <div className="font-semibold text-sm">{People.shortName(goal.champion!)}</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="bg-red-100 px-1.5 py-1 rounded-lg text-xs font-semibold text-red-800">78%</div>
        </div>
      </div>
    </div>
  );
}

// <GoalGroups groups={groups} />

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
        <span className="whitespace-nowrap">{group.space.name}</span>
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
