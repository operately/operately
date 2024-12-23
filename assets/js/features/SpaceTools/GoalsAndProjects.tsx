import React, { useMemo } from "react";

import { Space } from "@/models/spaces";
import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";
import { splitByStatus } from "@/models/milestones";

import { PieChart, ProgressBar } from "@/components/charts";
import { assertPresent } from "@/utils/assertions";
import { Paths } from "@/routes/paths";

import { Container, Title, ZeroResourcesContainer } from "./components";
import { calculateStatus } from "./utils";
import { GhostButton, SecondaryButton } from "@/components/Buttons";

import * as Icons from "@tabler/icons-react";
import { COLORS } from "@/components/status/constants";
import classNames from "classnames";
import { Props } from "react-select";

interface GoalsAndProjectsProps {
  title: string;
  space: Space;
  goals: Goal[];
  projects: Project[];
}

export function GoalsAndProjects({ title, space, goals, projects }: GoalsAndProjectsProps) {
  const path = Paths.spaceGoalsPath(space.id!);

  const openGoals = goals.filter((g) => !g.closedAt);
  const openProjects = projects.filter((p) => p.status !== "closed" && p.status !== "paused");

  return (
    <Container path={path} testId="goals-and-projects">
      <div className="flex flex-col items-center justify-center w-full group">
        <div className="relative w-full h-[170px] mt-10 opacity-75 px-[50px] flex flex-col gap-3">
          <GoalTreeExample />
        </div>

        <div className="flex flex-col justify-center items-center">
          <div className="text-base font-bold">Goals &amp; Projects</div>

          <div className="flex gap-2 mt-1 mb-4 text-center px-6 text-sm">
            Set goals, track your progress, and collaborate with your team to achieve them.
          </div>

          <GhostButton size="sm" linkTo={Paths.spaceGoalsPath(space.id!)} testId="edit-space">
            Add goal or project
          </GhostButton>
        </div>
      </div>
    </Container>
  );
}

function GoalTreeExample() {
  return (
    <div className="flex flex-col">
      <WorkItem title="Yearly Goal" progress={20} />
      <WorkItem title="Quarterly Goal 1" progress={60} indent={1} />
      <WorkItem title="Project 1" progress={90} indent={2} type="project" />
      <WorkItem title="Quarterly Goal 2" progress={60} indent={1} />
    </div>
  );
}

function WorkItem({ indent = 0, progress = 20, title, type = "goal" }) {
  const icon = type === "goal" ? Icons.IconTargetArrow : Icons.IconHexagons;

  const colors =
    type === "goal"
      ? "bg-stone-100 dark:bg-stone-600 group-hover:bg-red-50 group-hover:dark:bg-red-500 group-hover:text-red-600"
      : "bg-stone-100 dark:bg-stone-600 group-hover:bg-indigo-50 group-hover:dark:bg-indigo-500 group-hover:text-indigo-600";

  return (
    <div
      className="flex items-center justify-between transition-all first:border-t border-b border-stroke-base py-1.5"
      style={{ paddingLeft: `${indent * 25}px` }}
    >
      <div className="flex items-center gap-2.5 group-hover:gap-3 transition-all">
        <div className={"rounded-full p-1 transition-all " + colors}>
          {React.createElement(icon, { size: 16, stroke: 1.7 })}
        </div>
        <div>
          <div className="font-bold text-[12px] leading-none">{title}</div>
        </div>
      </div>
      <div>
        <ExampleProgressBar progress={progress} />
      </div>
    </div>
  );
}

function ExampleProgressBar({ progress }) {
  const className = classNames("h-2 bg-surface-outline rounded relative w-8");

  return (
    <div className={className}>
      <div
        className="bg-accent-1 rounded absolute top-0 bottom-0 left-0 bg-stone-400 group-hover:bg-accent-1 transition-all group-hover:scale-105"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function ZeroGoalsAndProjects() {
  return <ZeroResourcesContainer>Add a new goal or project to begin tracking your progress!</ZeroResourcesContainer>;
}

function Goals({ goals, projectsCount }: { goals: Goal[]; projectsCount: number }) {
  if (goals.length < 1) return <></>;

  // Limiting the number of goals to ensure that the component
  // displays goals and projects evenly in the container.
  // With the current fixed 380px height, only 9 goals and project
  // can be displayed.
  const slicedGoals = useMemo(() => {
    if (projectsCount > 4) {
      return goals.slice(0, 5);
    }
    return goals.slice(0, 9 - projectsCount);
  }, []);

  return (
    <div className="flex flex-col px-2 py-3">
      <Header goals={goals} type="goals" />

      {slicedGoals.map((goal) => (
        <GoalItem goal={goal} key={goal.id} />
      ))}
    </div>
  );
}

function GoalItem({ goal }: { goal: Goal }) {
  assertPresent(goal.progressPercentage, "progressPercentage must be present in goal");

  const status = useMemo(() => {
    if (goal.isOutdated) return "outdated";
    if (!goal.lastCheckIn) return "on_track";
    return goal.lastCheckIn.status!;
  }, [goal.isOutdated, goal.lastCheckIn]);

  return (
    <div className="flex gap-2 items-center">
      <div className="border-l border-surface-outline ml-2 h-[20px]"></div>

      <div className="flex items-center justify-between gap-1 overflow-hidden flex-1 mr-2">
        {/* Extra div is necessary to ensure all bars have the same size */}
        <div className="truncate ml-1">{goal.name}</div>
        <div>
          <ProgressBar percentage={goal.progressPercentage} status={status} className="w-[50px] h-[9px]" />
        </div>
      </div>
    </div>
  );
}

function Projects({ projects }: { projects: Project[] }) {
  if (projects.length < 1) return <></>;

  return (
    <div className="flex flex-col px-2 py-3">
      <Header projects={projects} type="projects" />

      {projects.map((project) => (
        <ProjectItem project={project} key={project.id} />
      ))}
    </div>
  );
}

function ProjectItem({ project }: { project: Project }) {
  assertPresent(project.milestones, "milestones must be present in project");

  const total = project.milestones.length;
  const { done } = splitByStatus(project.milestones);

  const percentage = total === 0 ? 0 : (done.length / total) * 100;

  return (
    <div className="flex gap-2 items-center">
      <div className="border-l border-surface-outline ml-2 h-[20px]"></div>

      <div className="flex items-center justify-between gap-1 overflow-hidden flex-1 mr-2">
        <div className="truncate">{project.name}</div>
        <div>
          <ProgressBar percentage={percentage} status={project.status!} className="w-[50px] h-[9px]" />
        </div>
      </div>
    </div>
  );
}

interface GoalsHeader {
  goals: Goal[];
  type: "goals";
}
interface ProjectsHeader {
  projects: Project[];
  type: "projects";
}
interface ResourceStatus {
  on_track: number;
  caution: number;
  issue: number;
  pending: number;
  total: number;
}

function Header(props: GoalsHeader | ProjectsHeader) {
  const status: ResourceStatus = React.useMemo(() => {
    switch (props.type) {
      case "goals":
        return calculateStatus(props.goals);
      case "projects":
        return calculateStatus(props.projects);
    }
  }, []);

  return (
    <div className="font-bold flex items-center gap-2 text-sm mb-2">
      <PieChart
        total={status.total}
        slices={[
          { size: status.on_track, color: "green" },
          { size: status.caution, color: "yellow" },
          { size: status.issue, color: "red" },
          { size: status.pending, color: "gray" },
        ]}
      />
      {status.on_track}/{status.total} {props.type} on track
    </div>
  );
}
