import * as React from "react";
import * as Goals from "@/models/goals";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";

import Avatar from "@/components/Avatar";
import classNames from "classnames";

import { Link, DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { DropdownMenu, DropdownMenuLinkItem } from "@/components/DropdownMenu";
import { DaysAgo } from "@/components/FormattedTime/DaysAgo";

import { Node } from "./tree";
import { useTreeContext, TreeContextProvider } from "./treeContext";

export function GoalTree({ goals }: { goals: Goals.Goal[] }) {
  return (
    <TreeContextProvider goals={goals}>
      <GoalTreeRoots />
    </TreeContextProvider>
  );
}

function GoalTreeRoots() {
  const { tree } = useTreeContext();

  return (
    <div>
      {tree.getRoots().map((root) => (
        <GoalNode key={root.goal.id} node={root} />
      ))}
    </div>
  );
}

function GoalNode({ node }: { node: Node }) {
  return (
    <div className="">
      <GoalHeader node={node} />
      <GoalChildren node={node} />
    </div>
  );
}

function GoalHeader({ node }: { node: Node }) {
  const titleClass = classNames({
    "font-bold text-lg": node.depth === 0,
    "font-medium": node.depth > 0,
    truncate: true,
  });

  const iconSize = node.depth === 0 ? 16 : 14;
  const path = Paths.goalPath(node.goal.id);

  return (
    <div className="flex items-center justify-between group relative hover:bg-surface-highlight px-1 -mx-1 gap-4">
      <div className="inline-flex items-center gap-1.5 truncate flex-1">
        <HiddenGoalActions node={node} />
        <Icons.IconTarget size={iconSize} className="text-red-500 shrink-0" />
        <DivLink to={path} className={titleClass}>
          {node.goal.name}
        </DivLink>
        <ChildrenInfo node={node} />
      </div>
      <div className="flex items-center gap-4">
        <GoalProgressBar goal={node.goal} />
      </div>
    </div>
  );
}

function HiddenGoalActions({ node }: { node: Node }) {
  const [optionsOpen, setOptionsOpen] = React.useState(false);

  const className = classNames("absolute flex items-center flex-row-reverse gap-1 -translate-x-[42px] w-[40px]", {
    "opacity-0 group-hover:opacity-100 transition-opacity": !optionsOpen,
  });

  return (
    <div className={className}>
      <GoalExpandCollapseToggle node={node} />
      <GoalOptions node={node} open={optionsOpen} setOpen={setOptionsOpen} />
    </div>
  );
}

function ChildrenInfo({ node }: { node: Node }) {
  const { expanded } = useTreeContext();

  if (!node.hasChildren) return null;
  if (expanded[node.goal.id]) return null;

  const subgoalCount = node.subGoals.length;
  const projectCount = node.projects.length;

  const labels = [
    subgoalCount > 0 ? `${subgoalCount} ${subgoalCount === 1 ? "subgoal" : "subgoals"}` : null,
    projectCount > 0 ? `${projectCount} ${projectCount === 1 ? "project" : "projects"}` : null,
  ];

  return <div className="text-xs text-gray-500">{labels.filter((l) => l).join(", ")}</div>;
}

function GoalOptions({ node, open, setOpen }: { node: Node; open: boolean; setOpen: (open: boolean) => void }) {
  const newGoalPath = Paths.goalNewPath({ parentGoalId: node.goal.id });
  const newProjectPath = Paths.projectNewPath({ goalId: node.goal.id });

  return (
    <DropdownMenu
      open={open}
      setOpen={setOpen}
      trigger={<Icons.IconDots size={14} className="cursor-pointer" />}
      options={[
        <DropdownMenuLinkItem key="add-goal" to={newGoalPath} title="Add Subgoal" />,
        <DropdownMenuLinkItem key="add-project" to={newProjectPath} title="Add Project" />,
      ]}
    />
  );
}

function GoalExpandCollapseToggle({ node }: { node: Node }) {
  const { expanded, toggleExpanded } = useTreeContext();

  const handleClick = () => toggleExpanded(node.goal.id);
  const size = node.depth === 0 ? 14 : 13;
  const ChevronIcon = expanded[node.goal.id] ? Icons.IconChevronDown : Icons.IconChevronRight;

  return <ChevronIcon size={size} className="cursor-pointer" onClick={handleClick} />;
}

function GoalChildren({ node }: { node: Node }) {
  const { expanded } = useTreeContext();

  if (!expanded[node.goal.id]) return null;

  return (
    <div className="relative">
      <div className="absolute top-0 left-1.5 w-0.5 h-full bg-surface-outline" />
      <div className="pl-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-1.5 font-medium text-sm text-content-dimmed">
            <Icons.IconCalendar size={16} />
            {node.goal.timeframe.split(" ")[0]}
          </div>

          <div>
            {node.goal.lastCheckIn && (
              <div className="flex items-center gap-1.5 font-medium text-sm">
                <Avatar person={node.goal.lastCheckIn!.author!} size={16} />
                <Link to={Paths.goalCheckInPath(node.goal.id, node.goal.lastCheckIn.id)}>
                  updated <DaysAgo date={node.goal.lastCheckIn.insertedAt} />
                </Link>
              </div>
            )}
          </div>
        </div>
        <div>{node.goal.targets?.map((target) => <TargetNode key={target!.id} target={target!} />)}</div>
        <div>{node.subGoals?.map((node) => <GoalNode key={node.goal.id} node={node} />)}</div>
        <div>{node.goal.projects?.map((project) => <ProjectNode key={project!.id} project={project!} />)}</div>
      </div>
    </div>
  );
}

function TargetNode({ target }: { target: Goals.Target }) {
  return (
    <div className="flex items-center justify-between group relative hover:bg-surface-highlight px-1 -mx-1 gap-4">
      <div className="inline-flex items-center gap-1.5 truncate flex-1">
        <Icons.IconShieldCheckFilled size={14} className="text-accent-1" />
        {target.name}
      </div>
      <div className="flex items-center gap-4">
        <TargetProgressBar target={target} />
      </div>
    </div>
  );
}

function ProjectNode({ project }: { project: Projects.Project }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icons.IconHexagonFilled size={14} className="text-blue-500" />
      <DivLink to={Paths.projectPath(project.id)} className="font-medium">
        {project.name}
      </DivLink>
    </div>
  );
}

function GoalLastCheckIn({ node }: { node: Node }) {
  const { lastCheckIn } = node.goal;

  return (
    <div className="text-sm w-24 leading-none flex items-center gap-1">
      <Icons.IconCalendar size={14} />
      {lastCheckIn ? (
        <DaysAgo date={lastCheckIn.insertedAt} className="font-medium" />
      ) : (
        <div className="text-content-dimmed">Never</div>
      )}
    </div>
  );
}

function GoalProgressBar({ goal }: { goal: Goals.Goal }) {
  return (
    <div className={"w-24 h-2.5 bg-surface-outline rounded relative"}>
      <div
        className="bg-accent-1 rounded absolute top-0 bottom-0 left-0"
        style={{ width: `${goal.progressPercentage}%` }}
      />
    </div>
  );
}

function TargetProgressBar({ target }: { target: Goals.Target }) {
  const from = target.from!;
  const to = target.to!;
  const value = target.value!;

  const width = ((Math.min(value, to) - from) / (Math.max(to, value) - from)) * 100;

  return (
    <div className={"w-16 h-1.5 bg-surface-outline rounded relative shrink-0"}>
      <div className="bg-accent-1 rounded absolute top-0 bottom-0 left-0" style={{ width: `${width}%` }} />
    </div>
  );
}
