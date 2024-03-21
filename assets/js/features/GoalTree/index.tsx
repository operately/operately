import * as React from "react";
import * as Goals from "@/models/goals";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";
import * as Popover from "@radix-ui/react-popover";

import classNames from "classnames";

import { Link, DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { DropdownMenu, DropdownMenuLinkItem } from "@/components/DropdownMenu";
import FormattedTime from "@/components/FormattedTime";

import { Node } from "./tree";
import { useTreeContext, TreeContextProvider } from "./treeContext";
import { Summary } from "@/components/RichContent";

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
    <div className="my-1">
      <GoalHeader node={node} />
      <GoalChildren node={node} />
    </div>
  );
}

function GoalHeader({ node }: { node: Node }) {
  const titleClass = classNames({
    "font-bold text-lg": node.depth === 0,
    "font-medium": node.depth > 0,
  });

  const iconSize = node.depth === 0 ? 16 : 14;
  const path = Paths.goalPath(node.goal.id);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 group relative">
        <HiddenGoalActions node={node} />
        <Icons.IconTarget size={iconSize} className="text-red-500" />
        <DivLink to={path} className={titleClass}>
          {node.goal.name}
        </DivLink>
        <ChildrenInfo node={node} />
      </div>
      <div>
        <GoalProgress goal={node.goal} />
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

  if (!node.hasChildren) return null;

  const handleClick = () => toggleExpanded(node.goal.id);
  const size = node.depth === 0 ? 14 : 13;
  const ChevronIcon = expanded[node.goal.id] ? Icons.IconChevronDown : Icons.IconChevronRight;

  return <ChevronIcon size={size} className="cursor-pointer" onClick={handleClick} />;
}

function GoalChildren({ node }: { node: Node }) {
  const { expanded } = useTreeContext();

  if (!expanded[node.goal.id] || !node.hasChildren) return null;

  return (
    <div className="relative">
      <div className="absolute top-0 left-1.5 w-0.5 h-full bg-surface-outline" />
      <div className="pl-6">
        <div>{node.subGoals?.map((node) => <GoalNode key={node.goal.id} node={node} />)}</div>
        <div>{node.goal.projects?.map((project) => <ProjectNode key={project!.id} project={project!} />)}</div>
      </div>
    </div>
  );
}

function ProjectNode({ project }: { project: Projects.Project }) {
  return (
    <div className="flex items-center gap-1.5 my-1.5">
      <Icons.IconHexagonFilled size={14} className="text-blue-500" />
      <DivLink to={Paths.projectPath(project.id)} className="font-medium text-sm">
        {project.name}
      </DivLink>
    </div>
  );
}

function GoalProgress({ goal }: { goal: Goals.Goal }) {
  return (
    <Popover.Root>
      <Popover.Trigger className="cursor-pointer">
        <GoalProgressBar goal={goal} />
      </Popover.Trigger>

      <Popover.Content
        sideOffset={5}
        alignOffset={-30}
        side="left"
        align="start"
        className="z-[1000] relative w-[550px]"
      >
        <div className="bg-surface rounded border border-surface-outline shadow-xl">
          <div className="font-bold px-4 pt-4 flex items-center justify-between">
            <div className="font-bold">Goal Progress</div>
            <div className="text-accent-1 font-extrabold">{Math.round(goal.progressPercentage)}% Complete</div>
          </div>

          <div className="px-4 pt-4 pb-2 text-sm">
            <div className="uppercase text-xs font-bold mb-2">Success Conditions</div>
            {goal.targets!.length > 0 ? (
              <div>
                {goal.targets!.map((target) => (
                  <div className="flex items-center gap-3 w-full not-first:border-t border-stroke-base py-1 justify-between">
                    <div className="truncate">{target!.name}</div>
                    <TargetProgressBar target={target!} />
                  </div>
                ))}
              </div>
            ) : (
              <div>No Success Conditions</div>
            )}
          </div>

          {goal.lastCheckIn && (
            <div className="p-4 border-t border-surface-outline bg-surface-dimmed font-medium rounded-b text-sm">
              <div className="uppercase text-xs font-bold mb-2">Last Check-in</div>

              <Summary jsonContent={goal.lastCheckIn?.content!["message"]} characterCount={200} />

              <div className="mt-2 flex items-center justify-between">
                <FormattedTime time={goal.updatedAt} format="short-date" />
                <Link to={Paths.goalCheckInPath(goal.id, goal.lastCheckIn!.id)}>View Check-in</Link>
              </div>
            </div>
          )}
        </div>
        <Popover.Arrow className="bg-surface" />
      </Popover.Content>
    </Popover.Root>
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
    <div className={"w-16 h-2 bg-surface-outline rounded relative shrink-0"}>
      <div className="bg-accent-1 rounded absolute top-0 bottom-0 left-0" style={{ width: `${width}%` }} />
    </div>
  );
}
