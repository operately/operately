import * as React from "react";
import * as Goals from "@/models/goals";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";
import * as Popover from "@radix-ui/react-popover";
import * as Milestones from "@/models/milestones";

import classNames from "classnames";
import { match } from "ts-pattern";

import { MilestoneIcon } from "@/components/MilestoneIcon";
import { Link, DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { DropdownMenu, DropdownMenuLinkItem } from "@/components/DropdownMenu";
import FormattedTime from "@/components/FormattedTime";
import { DaysAgo } from "@/components/FormattedTime/DaysAgo";

import { Node, GoalNode, ProjectNode } from "./tree";
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
      <div className="flex items-center justify-between py-2 bg-surface-dimmed -mx-12 px-12 border-y border-stroke-base">
        <div className="font-bold text-xs uppercase">Goal</div>
        <div className="flex items-center gap-4">
          <div className="font-bold text-xs uppercase w-24">PROGRESS</div>
          <div className="font-bold text-xs uppercase w-24">LAST CHECK-IN</div>
        </div>
      </div>

      {tree.getRoots().map((root) => (
        <NodeView key={root.id} node={root} />
      ))}
    </div>
  );
}

function NodeView({ node }: { node: Node }) {
  return (
    <div className="">
      <NodeHeader node={node} />
      <NodeChildren node={node} />
    </div>
  );
}

function NodeHeader({ node }: { node: Node }) {
  return (
    <TableRow>
      <div className="inline-flex items-center gap-1.5 truncate flex-1 group" style={{ paddingLeft: node.depth * 30 }}>
        <NodeActions node={node} />
        <NodeIcon node={node} />
        <NodeHeaderNameLink node={node} />
        <NodeHeaderChildrenInfo node={node} />
      </div>
      <div className="flex items-center gap-4">
        <NodeProgress node={node} />
        <NodeLastCheckIn node={node} />
      </div>
    </TableRow>
  );
}

// <HiddenGoalActions node={node} />

function NodeIcon({ node }: { node: Node }) {
  switch (node.type) {
    case "goal":
      return <Icons.IconTarget size={16} className="text-red-500 shrink-0" />;
    case "project":
      return <Icons.IconHexagonFilled size={16} className="text-blue-500 shrink-0" />;
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}

function NodeHeaderNameLink({ node }: { node: Node }) {
  const titleClass = classNames({
    "font-bold": node.depth === 0,
    "font-medium": node.depth > 0,
    truncate: true,
  });

  return (
    <DivLink to={node.linkTo} className={titleClass}>
      {node.name}
    </DivLink>
  );
}

function NodeHeaderChildrenInfo({ node }: { node: Node }) {
  const { expanded } = useTreeContext();

  if (!node.hasChildren) return null;
  if (expanded[node.id]) return null;

  return <div className="text-xs text-gray-500">{node.childrenInfoLabel()}</div>;
}

function NodeChildren({ node }: { node: Node }) {
  const { expanded } = useTreeContext();

  if (!expanded[node.id] || !node.hasChildren) return null;

  return (
    <div className="relative">
      <div className="">
        <div>{node.children?.map((node) => <NodeView key={node.id} node={node} />)}</div>
      </div>
    </div>
  );
}
// <div className="absolute -top-1 left-1.5 w-0.5 -bottom-1 bg-surface-outline z-[100]" />

function TableRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-stroke-base -mx-12 px-12 hover:bg-surface-highlight">
      {children}
    </div>
  );
}

function NodeActions({ node }: { node: Node }) {
  const [optionsOpen, setOptionsOpen] = React.useState(false);

  const className = classNames("absolute flex items-center flex-row-reverse gap-1 -translate-x-[42px] w-[40px]", {
    "opacity-0 group-hover:opacity-100 transition-opacity": !optionsOpen,
  });

  return (
    <div className={className}>
      <NodeExpandCollapseToggle node={node} />
    </div>
  );
}

// <GoalOptions node={node} open={optionsOpen} setOpen={setOptionsOpen} />

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

function NodeExpandCollapseToggle({ node }: { node: Node }) {
  const { expanded, toggleExpanded } = useTreeContext();

  if (!node.hasChildren) return null;

  const handleClick = () => toggleExpanded(node.id);
  const size = 14;
  const ChevronIcon = expanded[node.id] ? Icons.IconChevronDown : Icons.IconChevronRight;

  return <ChevronIcon size={size} className="cursor-pointer" onClick={handleClick} />;
}

function NodeLastCheckIn({ node }: { node: Node }) {
  return match(node.type)
    .with("goal", () => <GoalLastCheckIn goal={(node as GoalNode).goal} />)
    .with("project", () => <ProjectLastCheckIn project={(node as ProjectNode).project} />)
    .exhaustive();
}

function GoalLastCheckIn({ goal }: { goal: Goals.Goal }) {
  const lastCheckIn = goal.lastCheckIn;

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

function ProjectLastCheckIn({ project }: { project: Projects.Project }) {
  const lastCheckIn = project.lastCheckIn;

  return (
    <div className="text-sm w-24">
      {lastCheckIn ? (
        <ProjectLastCheckInDateWithPopover project={project} />
      ) : (
        <div className="flex items-center gap-1 leading-none">
          <Icons.IconCalendar size={14} />
          <div className="text-content-dimmed">Never</div>
        </div>
      )}
    </div>
  );
}

function ProjectLastCheckInDateWithPopover({ project }: { project: Projects.Project }) {
  return (
    <Popover.Root>
      <Popover.Trigger className="cursor-pointer pt-0.5 flex items-center gap-1">
        <Icons.IconCalendar size={14} />
        <DaysAgo date={project.lastCheckIn!.insertedAt} className="font-medium" />
      </Popover.Trigger>

      <Popover.Content
        sideOffset={5}
        alignOffset={-30}
        side="left"
        align="start"
        className="z-[1000] relative w-[550px]"
      >
        <div className="bg-surface rounded border border-surface-outline shadow-xl p-4">
          <div className="uppercase text-xs font-bold mb-2">Last Check-in</div>

          <Summary jsonContent={project.lastCheckIn?.description} characterCount={400} />

          <div className="mt-2 flex items-center justify-between">
            <FormattedTime time={project.lastCheckIn!.insertedAt} format="short-date" />
            <Link to={Paths.projectCheckInPath(project.id, project.lastCheckIn!.id)}>View Check-in</Link>
          </div>
        </div>

        <Popover.Arrow className="bg-surface" />
      </Popover.Content>
    </Popover.Root>
  );
}

function NodeProgress({ node }: { node: Node }) {
  return match(node.type)
    .with("goal", () => <GoalProgress goal={(node as GoalNode).goal} />)
    .with("project", () => <ProjectProgress project={(node as ProjectNode).project} />)
    .exhaustive();
}

function GoalProgress({ goal }: { goal: Goals.Goal }) {
  return (
    <Popover.Root>
      <Popover.Trigger className="cursor-pointer pt-0.5">
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
        </div>
        <Popover.Arrow className="bg-surface" />
      </Popover.Content>
    </Popover.Root>
  );
}

// {goal.lastCheckIn && (
// )}

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

function ProjectProgressBar({ progress }: { progress: number }) {
  return (
    <div className={"w-24 h-2.5 bg-surface-outline rounded relative"}>
      <div className="bg-accent-1 rounded absolute top-0 bottom-0 left-0" style={{ width: `${progress}%` }} />
    </div>
  );
}

function ProjectProgress({ project }: { project: Projects.Project }) {
  const completedMilestones = project.milestones!.filter((m) => m!.status === "done").length;
  const totalMilestones = project.milestones!.length;
  const progress = (completedMilestones / totalMilestones) * 100;

  const milestones = Milestones.sortByDeadline(project.milestones!.map((m) => m!));
  const { pending, done } = Milestones.splitByStatus(milestones);

  return (
    <Popover.Root>
      <Popover.Trigger className="cursor-pointer pt-0.5">
        <ProjectProgressBar progress={progress} />
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
            <div className="font-bold">Project Progress</div>
            <div className="text-accent-1 font-extrabold">{Math.round(progress)}% Complete</div>
          </div>

          <PendingMilestones project={project} pending={pending} />
          <DoneMilestones project={project} done={done} />
        </div>
        <Popover.Arrow className="bg-surface" />
      </Popover.Content>
    </Popover.Root>
  );
}

function PendingMilestones({ project, pending }: { project: Projects.Project; pending: Milestones.Milestone[] }) {
  if (pending.length === 0) return null;

  return (
    <div className="px-4 pb-4 text-sm">
      <div className="uppercase text-xs font-bold mb-1 mt-4 tracking-wide">Upcoming Milestones</div>

      <div>
        {pending!.map((milestone) => (
          <div className="flex items-center gap-3 w-full not-first:border-t border-stroke-base py-1 justify-between">
            <div className="inline-flex items-center gap-1 flex-1 truncate">
              <MilestoneIcon milestone={milestone!} />
              <DivLink className="truncate hover:underline" to={Paths.projectMilestonePath(project.id, milestone!.id)}>
                {milestone!.title}
              </DivLink>
            </div>

            <div className="shrink-0">
              <FormattedTime time={milestone!.deadlineAt!} format="short-date" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DoneMilestones({ project, done }: { project: Projects.Project; done: Milestones.Milestone[] }) {
  if (done.length === 0) return null;

  return (
    <div className="bg-surface-dimmed border-t border-surface-outline px-4 py-4 text-sm">
      <div className="uppercase text-xs font-bold tracking-wide mb-1">Completed Milestones</div>

      <div>
        {done!.map((milestone) => (
          <div className="flex items-center gap-3 w-full not-first:border-t border-stroke-base py-1 justify-between">
            <div className="inline-flex items-center gap-1 truncate">
              <MilestoneIcon milestone={milestone!} />
              <DivLink className="truncate hover:underline" to={Paths.projectMilestonePath(project.id, milestone!.id)}>
                {milestone!.title}
              </DivLink>
            </div>

            <div className="shrink-0">
              Completed on <FormattedTime time={milestone!.completedAt!} format="short-date" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
