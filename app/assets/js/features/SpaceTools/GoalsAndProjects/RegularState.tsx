import React, { useMemo } from "react";

import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";
import { Space } from "@/models/spaces";

import { splitByStatus } from "@/models/milestones";

import { ProgressBar } from "@/components/charts";
import { assertPresent } from "@/utils/assertions";
import { PieChart } from "turboui";

import { statusColor } from "@/components/status/colors";
import { Title } from "../components";
import { calculateGoalStatuses, calculateProjectStatuses } from "../utils";

interface Props {
  title: string;
  space: Space;
  goals: Goal[];
  projects: Project[];
}

export function RegularState(props: Props) {
  const openGoals = calcOpenGoals(props);
  const openProjects = calcOpenProjects(props);

  return (
    <div>
      <Title title={props.title} />

      <div className="bg-surface-dimmed rounded mx-2">
        <Goals goals={openGoals} projectsCount={openProjects.length} />
        <Projects projects={openProjects} />
      </div>
    </div>
  );
}

function calcOpenGoals(props: Props) {
  return props.goals.filter((g) => !g.closedAt);
}

function calcOpenProjects(props: Props) {
  return props.projects.filter((p) => p.state !== "closed");
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

  const color = statusColor(status);

  return (
    <div className="flex gap-2 items-center">
      <div className="border-l border-surface-outline ml-2 h-[20px]"></div>

      <div className="flex items-center justify-between gap-1 overflow-hidden flex-1 mr-2">
        {/* Extra div is necessary to ensure all bars have the same size */}
        <div className="truncate ml-1">{goal.name}</div>
        <div>
          <ProgressBar percentage={goal.progressPercentage} width="w-[50px]" height="h-[9px]" color={color} />
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

  const color = React.useMemo(() => {
    if (project.state === "paused") {
      return statusColor(project.state);
    } else {
      return statusColor(project.lastCheckIn?.status ?? "on_track");
    }
  }, [project.state, project.lastCheckIn]);

  return (
    <div className="flex gap-2 items-center">
      <div className="border-l border-surface-outline ml-2 h-[20px]"></div>

      <div className="flex items-center justify-between gap-1 overflow-hidden flex-1 mr-2">
        <div className="truncate">{project.name}</div>
        <div>
          <ProgressBar percentage={percentage} width="w-[50px]" height="h-[9px]" color={color} />
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
  off_track: number;
  pending: number;
  paused: number;
  total: number;
}

function Header(props: GoalsHeader | ProjectsHeader) {
  const status: ResourceStatus = React.useMemo(() => {
    switch (props.type) {
      case "goals":
        return calculateGoalStatuses(props.goals);
      case "projects":
        return calculateProjectStatuses(props.projects);
    }
  }, []);

  const onTrackPercentage = (status.on_track / status.total) * 100;
  const cautionPercentage = (status.caution / status.total) * 100;
  const issuePercentage = (status.off_track / status.total) * 100;
  const pendingPercentage = (status.pending / status.total) * 100;
  const pausedPercentage = (status.paused / status.total) * 100;

  return (
    <div className="font-bold flex items-center gap-2 text-sm mb-2">
      <PieChart
        size={16}
        slices={[
          { percentage: onTrackPercentage, color: "rgb(22, 163, 74)" },
          { percentage: cautionPercentage, color: "rgb(250, 204, 21)" },
          { percentage: issuePercentage, color: "rgb(239, 68, 68)" },
          { percentage: pendingPercentage, color: "rgb(107, 114, 128)" },
          { percentage: pausedPercentage, color: "rgb(156, 163, 175)" },
        ]}
      />
      {status.on_track}/{status.total} {props.type} on track
    </div>
  );
}
