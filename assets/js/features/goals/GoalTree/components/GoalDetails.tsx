import React, { useMemo } from "react";

import * as Goals from "@/models/goals";
import * as Timeframes from "@/utils/timeframes";
import { useWindowSizeBreakpoints } from "@/components/Pages";

import classNames from "classnames";
import { match } from "ts-pattern";
import { IconCalendar, IconMinus, IconPlus } from "@tabler/icons-react";
import { includesId, Paths } from "@/routes/paths";
import { createTestId } from "@/utils/testid";
import { assertPresent } from "@/utils/assertions";
import { ProgressBar } from "@/components/ProgressBar";
import { MiniPieChart } from "@/components/MiniPieChart";
import { SecondaryButton } from "@/components/Buttons";
import { DivLink } from "@/components/Link";
import { AvatarLink } from "@/components/Avatar";
import { DescriptionSection, StatusSection, TargetsSection } from "@/features/goals/GoalCheckIn";

import { GoalNode, Node } from "../tree";
import { useExpandable } from "../context/Expandable";
import { useTreeContext } from "../treeContext";
import { Status } from "./Status";

export function GoalDetails({ node }: { node: GoalNode }) {
  const size = useWindowSizeBreakpoints();
  const { density } = useTreeContext();

  const layout = match(size)
    .with("xs", () => "grid grid-cols-[auto,1fr] gap-y-0 mt-1")
    .otherwise(() => "flex gap-y-2");

  const className = classNames("gap-x-10 items-center", layout);

  return (
    <div className="pl-6 ml-[1px]">
      {density !== "compact" && (
        <div className={className}>
          <GoalStatus goal={node.goal} />
          <GoalTimeframe goal={node.goal} />
          <ChampionAndSpace goal={node.goal} />
          <GoalChildrenCount node={node} />
        </div>
      )}

      <GoalSuccessConditions node={node} />
    </div>
  );
}

export function GoalProgressBar({ node }: { node: GoalNode }) {
  assertPresent(node.goal.progressPercentage, "progressPercentage must be present in goal");

  const size = useWindowSizeBreakpoints();
  const width = match(size)
    .with("xs", () => "w-16")
    .with("sm", () => "w-16")
    .otherwise(() => undefined);

  return (
    <div style={{ height: "10px" }}>
      <ProgressBar percentage={node.goal.progressPercentage} className="ml-2" width={width} />
    </div>
  );
}

export function ExpandGoalSuccessConditions({ node }: { node: GoalNode }) {
  const { goalExpanded, toggleGoalExpanded } = useExpandable();
  const testId = createTestId("toggle-goal", node.goal.id!);

  return (
    <div>
      <div
        onClick={() => toggleGoalExpanded(node.goal.id!)}
        className="ml-2 h-[20px] w-[20px] rounded-full border-2 border-surface-outline flex items-center justify-center cursor-pointer"
        data-test-id={testId}
      >
        {includesId(goalExpanded, node.goal.id) ? (
          <IconMinus size={12} stroke={3} className="border-surface-outline shrink-0" />
        ) : (
          <IconPlus size={12} stroke={3} className="border-surface-outline shrink-0" />
        )}
      </div>
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
      <SecondaryButton linkTo={newGoalPath} size="xxs" testId="add-subgoal">
        Add sub-goal
      </SecondaryButton>
      <SecondaryButton linkTo={newProjectPath} size="xxs">
        Create project
      </SecondaryButton>
    </div>
  );
}

function GoalStatus({ goal }: { goal: Goals.Goal }) {
  return (
    <Status resource={goal} resourceType="goal">
      <StatusSection update={goal.lastCheckIn!} reviewer={goal.reviewer || undefined} />
      <DescriptionSection update={goal.lastCheckIn!} limit={120} />
      <TargetsSection update={goal.lastCheckIn!} />
    </Status>
  );
}

function GoalTimeframe({ goal }: { goal: Goals.Goal }) {
  const timeframe = Timeframes.parse(goal.timeframe!);

  return (
    <div className="flex gap-1 items-center text-xs text-content-dimmed">
      <IconCalendar size={13} className="text-content-dimmed mb-[1px]" />
      {Timeframes.format(timeframe)}
    </div>
  );
}

function ChampionAndSpace({ goal }: { goal: Goals.Goal }) {
  assertPresent(goal.champion, "champion must be present in goal");
  assertPresent(goal.space, "space must be present in goal");

  const path = Paths.spacePath(goal.space.id!);

  return (
    <div className="flex items-center gap-1">
      <AvatarLink person={goal.champion} size="tiny" className="mt-[6px]" />
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

function GoalSuccessConditions({ node }: { node: GoalNode }) {
  const { goalExpanded } = useExpandable();
  assertPresent(node.goal.targets, "targets must be present in goal");

  if (!includesId(goalExpanded, node.goal.id)) return <></>;

  return (
    <div className="mt-2">
      {node.goal.targets.map((t) => {
        const total = t.to! - t.from!;
        const completed = t.value! - t.from!;

        return (
          <div key={t.id} className="flex items-center gap-2 text-sm text-content-dimmed">
            <MiniPieChart total={total} completed={completed} />
            {t.name}
          </div>
        );
      })}
    </div>
  );
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
