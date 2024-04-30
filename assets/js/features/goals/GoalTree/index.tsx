import * as React from "react";
import * as Goals from "@/models/goals";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";
import * as Popover from "@radix-ui/react-popover";
import * as Milestones from "@/models/milestones";
import * as People from "@/models/people";
import * as Time from "@/utils/time";
import * as Timeframes from "@/utils/timeframes";

import classNames from "classnames";
import { match } from "ts-pattern";
import { createTestId } from "@/utils/testid";

import { FilledButton } from "@/components/Button";
import { MilestoneIcon } from "@/components/MilestoneIcon";
import { DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { DropdownMenu, DropdownMenuLinkItem } from "@/components/DropdownMenu";
import { DaysAgo } from "@/components/FormattedTime/DaysAgo";
import { SmallStatusIndicator } from "@/features/projectCheckIns/SmallStatusIndicator";

import { Node, GoalNode, ProjectNode, SortColumn } from "./tree";
import { useTreeContext, TreeContextProvider, TreeContextProviderProps } from "./treeContext";

import RichContent from "@/components/RichContent";
import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";

import { Controls } from "./components/Controls";
import { NodeIcon } from "./components/NodeIcon";
import { NodeName } from "./components/NodeName";
import { TableRow } from "./components/TableRow";

import { useExpandable } from "./context/Expandable";

export function GoalTree(props: TreeContextProviderProps) {
  return (
    <TreeContextProvider {...props}>
      <GoalTreeRoots />
    </TreeContextProvider>
  );
}

function GoalTreeRoots() {
  const context = useTreeContext();

  return (
    <div>
      <Controls />

      <div className="flex items-center justify-between py-2 bg-surface-dimmed -mx-12 px-12 border-y border-stroke-base">
        <GoalTreeColumnHeader title="Name" width="flex-1" sortId="name" />

        <div className="flex items-center gap-4">
          <GoalTreeColumnHeader title="Champion" width="w-24" sortId="champion" />
          {context.hideSpaceColumn ? null : <GoalTreeColumnHeader title="Space" width="w-24" sortId="space" />}
          <GoalTreeColumnHeader title="Check-in" width="w-24" sortId="lastCheckIn" />
          <GoalTreeColumnHeader title="Timeframe" width="w-24" sortId="timeframe" />
          <GoalTreeColumnHeader title="Progress" width="w-24" sortId="progress" />
        </div>
      </div>

      {context.tree.map((root) => (
        <NodeView key={root.id} node={root} />
      ))}
    </div>
  );
}

function GoalTreeColumnHeader({ title, width, sortId }: { title: string; width: string; sortId: SortColumn }) {
  const className = classNames("font-bold text-xs uppercase flex items-center gap-1 group", width);
  const { sortColumn, sortDirection, setSortColumn, setSortDirection } = useTreeContext();

  const handleArrowClick = () => {
    if (sortColumn === sortId) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(sortId);
      setSortDirection("asc");
    }
  };

  let icon = Icons.IconArrowDown;

  if (sortColumn === sortId) {
    if (sortDirection === "asc") {
      icon = Icons.IconArrowUp;
    } else {
      icon = Icons.IconArrowDown;
    }
  } else {
    icon = Icons.IconArrowUp;
  }

  const sortArrowClass = classNames("cursor-pointer", {
    "opacity-0 group-hover:opacity-100 transition-opacity": sortColumn !== sortId,
  });

  const sortArrow = React.createElement(icon, { size: 12, onClick: handleArrowClick, className: sortArrowClass });

  return (
    <div className={className}>
      {title} {sortArrow}
    </div>
  );
}

function NodeView({ node }: { node: Node }) {
  return (
    <div>
      <NodeHeader node={node} />
      <NodeChildren node={node} />
    </div>
  );
}

function NodeHeader({ node }: { node: Node }) {
  const context = useTreeContext();
  const testId = createTestId(node.type, node.name);

  return (
    <TableRow className="-mx-12 px-12" testId={testId}>
      <div
        className="inline-flex items-center gap-1.5 truncate flex-1 group pr-2"
        style={{ paddingLeft: node.depth * 30 }}
      >
        <NodeActions node={node} />
        <NodeIcon node={node} />
        <NodeName node={node} />
        <NodeHeaderChildrenInfo node={node} />
      </div>
      <div className="flex items-center gap-4">
        <NodeChampion node={node} />
        {context.hideSpaceColumn ? null : <NodeSpace node={node} />}
        <NodeLastCheckIn node={node} />
        <NodeTimeframe node={node} />
        <NodeProgress node={node} />
      </div>
    </TableRow>
  );
}

function NodeSpace({ node }: { node: Node }) {
  return (
    <div className="text-sm w-24 truncate">
      <DivLink
        to={Paths.spaceGoalsPath(node.space.id)}
        className="hover:underline decoration-content-subtle font-medium"
      >
        {node.space.name}
      </DivLink>
    </div>
  );
}

function NodeTimeframe({ node }: { node: Node }) {
  return match(node.type)
    .with("goal", () => <GoalTimeframe goal={(node as GoalNode).goal} />)
    .with("project", () => <ProjectTimeframe project={(node as ProjectNode).project} />)
    .exhaustive();
}

function GoalTimeframe({ goal }: { goal: Goals.Goal }) {
  const timeframe = Timeframes.parse(goal.timeframe);

  return <div className="text-sm w-24 truncate">{Timeframes.format(timeframe)}</div>;
}

function ProjectTimeframe({ project }: { project: Projects.Project }) {
  const start = Time.parse(project.startedAt);
  const end = Time.parse(project.deadline);

  if (!start || !end) return <div className="text-sm w-24 text-content-dimmed">Not set</div>;

  return (
    <div className="text-xs w-24 truncate">
      <FormattedTime time={start} format="short-date" /> - <FormattedTime time={end} format="short-date" />
    </div>
  );
}

function NodeChampion({ node }: { node: Node }) {
  return (
    <DivLink
      className="flex items-center gap-1.5 text-sm truncate w-24 cursor-pointer"
      to={Paths.profileGoalsPath(node.champion!.id)}
    >
      <Avatar person={node.champion!} size={16} />
      <div className="truncate">{People.firstName(node.champion!)}</div>
    </DivLink>
  );
}

function NodeHeaderChildrenInfo({ node }: { node: Node }) {
  const { expanded } = useExpandable();

  if (!node.hasChildren) return null;
  if (expanded[node.id]) return null;

  return <div className="text-xs text-gray-500">{node.childrenInfoLabel()}</div>;
}

function NodeChildren({ node }: { node: Node }) {
  const { expanded } = useExpandable();

  if (!expanded[node.id] || !node.hasChildren) return null;

  return (
    <div className="relative">
      <div className="">
        <div>{node.children?.map((node) => <NodeView key={node.id} node={node} />)}</div>
      </div>
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
      {node.type === "goal" && <GoalOptions node={node as GoalNode} open={optionsOpen} setOpen={setOptionsOpen} />}
    </div>
  );
}

function GoalOptions({ node, open, setOpen }: { node: GoalNode; open: boolean; setOpen: (open: boolean) => void }) {
  const newGoalPath = Paths.goalNewPath({ parentGoalId: node.goal.id });
  const newProjectPath = Paths.projectNewPath({ goalId: node.goal.id });
  const testId = createTestId(node.type, "options", node.goal.name);

  return (
    <DropdownMenu
      testId={testId}
      open={open}
      setOpen={setOpen}
      trigger={<Icons.IconDots size={14} className="cursor-pointer" />}
      options={[
        <DropdownMenuLinkItem testId="add-subgoal" key="add-goal" to={newGoalPath} title="Add Subgoal" />,
        <DropdownMenuLinkItem key="add-project" to={newProjectPath} title="Add Project" />,
      ]}
    />
  );
}

function NodeExpandCollapseToggle({ node }: { node: Node }) {
  const { expanded, toggleExpanded } = useExpandable();

  if (!node.hasChildren) return null;

  const handleClick = () => toggleExpanded(node.id);
  const size = 16;
  const ChevronIcon = expanded[node.id] ? Icons.IconChevronDown : Icons.IconChevronRight;

  return <ChevronIcon size={size} className="cursor-pointer" onClick={handleClick} />;
}

function NodeLastCheckIn({ node }: { node: Node }) {
  return match(node.type)
    .with("goal", () => <GoalLastCheckIn goal={(node as GoalNode).goal} />)
    .with("project", () => <ProjectLastCheckIn project={(node as ProjectNode).project} />)
    .exhaustive();
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
        <div className="bg-surface rounded border border-surface-outline shadow-xl">
          <div className="flex items-center justify-between px-4 pt-4 text-sm">
            <div className="uppercase font-bold">Last Check-in</div>

            <FilledButton
              size="xs"
              type="secondary"
              linkTo={Paths.projectCheckInPath(project.id, project.lastCheckIn!.id)}
              linkTarget="_blank"
            >
              Open <Icons.IconArrowUpRight size={14} className="ml-1 inline-block" />
            </FilledButton>
          </div>

          <div className="inline-flex items-center gap-1 text-sm w-full px-4 mt-2">
            <Avatar person={project.lastCheckIn!.author} size={16} /> {project.lastCheckIn!.author.fullName} on{" "}
            <FormattedTime time={project.lastCheckIn!.insertedAt} format="short-date" />
          </div>

          <div className="overflow-y-auto border-y border-surface-outline mt-2 px-4 py-2">
            <div className="mb-2">
              <SmallStatusIndicator status={project.lastCheckIn!.status} />
            </div>
            <RichContent jsonContent={project.lastCheckIn?.description!} />
          </div>
        </div>

        <Popover.Arrow className="bg-surface" />
      </Popover.Content>
    </Popover.Root>
  );
}

function GoalLastCheckIn({ goal }: { goal: Goals.Goal }) {
  const lastCheckIn = goal.lastCheckIn;

  return (
    <div className="text-sm w-24">
      {lastCheckIn ? (
        <GoalLastCheckInDateWithPopover goal={goal} />
      ) : (
        <div className="flex items-center gap-1 leading-none">
          <Icons.IconCalendar size={14} />
          <div className="text-content-dimmed">Never</div>
        </div>
      )}
    </div>
  );
}

function GoalLastCheckInDateWithPopover({ goal }: { goal: Goals.Goal }) {
  return (
    <Popover.Root>
      <Popover.Trigger className="cursor-pointer pt-0.5 flex items-center gap-1">
        <Icons.IconCalendar size={14} />
        <DaysAgo date={goal.lastCheckIn!.insertedAt} className="font-medium" />
      </Popover.Trigger>

      <Popover.Content
        sideOffset={5}
        alignOffset={-30}
        side="left"
        align="start"
        className="z-[1000] relative w-[550px]"
      >
        <div className="bg-surface rounded border border-surface-outline shadow-xl">
          <div className="flex items-center justify-between px-4 pt-4 text-sm">
            <div className="uppercase font-bold">Last Check-in</div>

            <FilledButton
              size="xs"
              type="secondary"
              linkTo={Paths.goalCheckInPath(goal.id, goal.lastCheckIn!.id)}
              linkTarget="_blank"
            >
              Open <Icons.IconArrowUpRight size={14} className="ml-1 inline-block" />
            </FilledButton>
          </div>

          <div className="inline-flex items-center gap-1 text-sm w-full px-4 mt-2">
            <Avatar person={goal.lastCheckIn!.author!} size={16} /> {goal.lastCheckIn!.author!.fullName} on{" "}
            <FormattedTime time={goal.lastCheckIn!.insertedAt} format="short-date" />
          </div>

          <div className="overflow-y-auto border-y border-surface-outline mt-2 px-4 py-2">
            <RichContent jsonContent={goal.lastCheckIn?.content!["message"]!} />
          </div>
        </div>

        <Popover.Arrow className="bg-surface" />
      </Popover.Content>
    </Popover.Root>
  );
}

function NodeProgress({ node }: { node: Node }) {
  return match(node.type)
    .with("goal", () => <GoalProgress node={node as GoalNode} />)
    .with("project", () => <ProjectProgress node={node as ProjectNode} />)
    .exhaustive();
}

function GoalProgress({ node }: { node: GoalNode }) {
  if (node.isClosed) return <CompletedProgress />;

  const goal = node.goal;

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
            <div className="text-accent-1 font-extrabold">{Math.round(node.progress)}% Complete</div>
          </div>

          <div className="px-4 pt-4 pb-2 text-sm">
            <div className="uppercase text-xs font-bold mb-2">Success Conditions</div>
            {goal.targets!.length > 0 ? (
              <div>
                {goal.targets!.map((target) => (
                  <div
                    key={target!.id}
                    className="flex items-center gap-3 w-full not-first:border-t border-stroke-base py-1 justify-between"
                  >
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
  return (
    <div className={"w-16 h-2 bg-surface-outline rounded relative shrink-0"}>
      <div
        className="bg-accent-1 rounded absolute top-0 bottom-0 left-0"
        style={{ width: `${Goals.targetProgressPercentage(target)}%` }}
      />
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

function ProjectProgress({ node }: { node: ProjectNode }) {
  const project = node.project;
  const progress = node.progress;

  if (project.closedAt) return <CompletedProgress />;

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

function CompletedProgress() {
  return (
    <div className={"w-24 h-2.5 flex items-center gap-1 text-sm font-medium"}>
      <Icons.IconCircleCheckFilled className="text-accent-1" size={20} /> Completed
    </div>
  );
}
