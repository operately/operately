import React, { useMemo } from "react";

import * as Goals from "@/models/goals";
import * as Timeframes from "@/utils/timeframes";

import classNames from "classnames";
import { match } from "ts-pattern";
import { createTestId } from "@/utils/testid";
import { IconCalendar, IconMinus, IconPlus } from "@tabler/icons-react";
import { includesId, Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { ProgressBar } from "@/components/ProgressBar";
import { MiniPieChart } from "@/components/MiniPieChart";
import { SecondaryButton } from "@/components/Buttons";
import { DivLink } from "@/components/Link";
import Avatar from "@/components/Avatar";

import { GoalNode, Node } from "../tree";
import { useExpandable } from "../context/Expandable";

export function GoalDetails({ node }: { node: GoalNode }) {
  return (
    <div className="pl-[42px]">
      <div className="flex gap-10 items-center">
        <GoalTimeframe goal={node.goal} />
        <ChampionAndSpace goal={node.goal} />
        <GoalChildrenCount node={node} />
      </div>

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
  const testId = createTestId("toggle-goal", node.goal.id!);

  return (
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
      <Avatar person={goal.champion} size="tiny" />
      <DivLink to={path} className="text-xs text-content-dimmed">
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
