import React, { useMemo } from "react";

import * as Goals from "@/models/goals";
import * as Timeframes from "@/utils/timeframes";
import * as Icons from "@tabler/icons-react";

import { useWindowSizeBreakpoints } from "@/components/Pages";

import classNames from "classnames";
import { match } from "ts-pattern";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { ProgressBar } from "@/components/charts";
import { SecondaryButton } from "@/components/Buttons";
import { DivLink } from "@/components/Link";
import { AvatarLink } from "@/components/Avatar";
import { DescriptionSection, StatusSection, TargetsSection } from "@/features/goals/GoalCheckIn";

import { GoalNode, Node } from "../tree";
import { useExpandable } from "../context/Expandable";
import { useTreeContext } from "../treeContext";
import { Status } from "./Status";
import { SmallStatusIndicator } from "@/components/status";

export function GoalDetails({ node }: { node: GoalNode }) {
  const size = useWindowSizeBreakpoints();
  const { density } = useTreeContext();

  if (density === "compact") return null;

  const layout = match(size)
    .with("xs", () => "grid grid-cols-[auto,1fr] gap-y-0 mt-1")
    .otherwise(() => "flex gap-y-2");

  const className = classNames("gap-x-10 items-center", layout);

  return (
    <div className="pl-6 ml-[2px] mt-2">
      <div className={className}>
        <GoalStatus goal={node} />
        <GoalTimeframe goal={node.goal} />
        <ChampionAndSpace goal={node.goal} />
        <GoalChildrenCount node={node} />
      </div>
    </div>
  );
}

export function GoalProgressBar({ node }: { node: GoalNode }) {
  assertPresent(node.goal.progressPercentage, "progressPercentage must be present in goal");

  if (node.goal.isClosed) return <></>;

  const size = useWindowSizeBreakpoints();
  const width = match(size)
    .with("xs", () => "w-16")
    .with("sm", () => "w-16")
    .otherwise(() => undefined);

  return <ProgressBar percentage={node.goal.progressPercentage} className="ml-2 h-2" width={width} />;
}

export function GoalActions({ hovered, node }: { hovered: boolean; node: GoalNode }) {
  const size = useWindowSizeBreakpoints();

  if (node.isClosed) return <></>;

  const containerClasses = classNames("ml-2 gap-1 items-center shrink-0", {
    "opacity-0": !hovered,
    "opacity-100 transition-opacity duration-300": hovered,
    hidden: size === "xs",
    flex: size !== "xs",
  });

  const newGoalPath = Paths.goalNewPath({ parentGoalId: node.goal.id! });
  const newProjectPath = Paths.newProjectPath({
    goalId: node.goal.id!,
    spaceId: node.goal.space!.id!,
    backPathName: "Back to Goal Map",
    backPath: window.location.pathname,
  });

  return (
    <div className={containerClasses}>
      <SecondaryButton linkTo={newGoalPath} size="xxs" testId="add-subgoal">
        Add sub-goal
      </SecondaryButton>
      <SecondaryButton linkTo={newProjectPath} size="xxs" testId="add-project">
        Create project
      </SecondaryButton>
    </div>
  );
}

function GoalStatus({ goal }: { goal: GoalNode }) {
  if (goal.isClosed) {
    const status = goal.goal!.success ? "accomplished" : "not_accomplished";
    return <SmallStatusIndicator status={status} size="sm" textClassName="text-content-dimmed" />;
  } else {
    return (
      <Status node={goal}>
        {goal.lastCheckIn && (
          <>
            <StatusSection update={goal.lastCheckIn!} reviewer={goal.reviewer || undefined} />
            <DescriptionSection update={goal.lastCheckIn!} limit={120} />
            <TargetsSection update={goal.asGoalNode().lastCheckIn!} />
          </>
        )}
      </Status>
    );
  }
}

function GoalTimeframe({ goal }: { goal: Goals.Goal }) {
  const timeframe = Timeframes.parse(goal.timeframe!);
  const isOverdue = Timeframes.isOverdue(timeframe) && !goal.isClosed;

  const className = classNames("flex gap-1 items-center text-xs text-content-dimmed", {
    "text-callout-warning-message": isOverdue,
  });

  return (
    <div className={className}>
      <GoalTimeframeIcon isOverdue={isOverdue} />
      {Timeframes.format(timeframe)}
    </div>
  );
}

function GoalTimeframeIcon({ isOverdue }: { isOverdue: boolean }) {
  if (isOverdue) {
    return <Icons.IconAlertTriangle size={13} className="text-callout-warning-message mb-[1px]" />;
  } else {
    return <Icons.IconCalendar size={13} className="text-content-dimmed mb-[1px]" />;
  }
}

function ChampionAndSpace({ goal }: { goal: Goals.Goal }) {
  assertPresent(goal.champion, "champion must be present in goal");
  assertPresent(goal.space, "space must be present in goal");

  const path = Paths.spacePath(goal.space.id!);

  return (
    <div className="flex items-center gap-1">
      <AvatarLink person={goal.champion} size="tiny" className="flex flex-col items-center" />
      <DivLink to={path} className="text-xs text-content-dimmed hover:underline underline-offset-2">
        {goal.space.name}
      </DivLink>
    </div>
  );
}

function GoalChildrenCount({ node }: { node: GoalNode }) {
  const { expanded } = useExpandable();

  const text = useMemo(() => {
    const { subgoals, projects } = countGoalChildren(node);

    const subgoalsText = match(subgoals)
      .with(0, () => null)
      .with(1, () => "1 subgoal")
      .otherwise(() => `${subgoals} subgoals`);

    const projectsText = match(projects)
      .with(0, () => null)
      .with(1, () => "1 project")
      .otherwise(() => `${projects} projects`);

    if (subgoalsText && projectsText) {
      return `${subgoalsText} and ${projectsText}`;
    }
    return subgoalsText || projectsText;
  }, [node]);

  if (expanded[node.goal.id!]) return <></>;

  return <div className="text-xs text-content-subtle">{text}</div>;
}

function countGoalChildren(node: GoalNode) {
  const dfs = (node: Node) => {
    for (let child of node.children) {
      if (child.type === "goal") {
        count.subgoals += 1;
      } else {
        count.projects += 1;
      }
      dfs(child);
    }
  };

  const count = { subgoals: 0, projects: 0 };
  dfs(node);

  return count;
}
