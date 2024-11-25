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

interface GoalsAndProjectsProps {
  space: Space;
  goals: Goal[];
  projects: Project[];
  toolsCount: number;
}

export function GoalsAndProjects({ space, goals, projects, toolsCount }: GoalsAndProjectsProps) {
  const path = Paths.spaceGoalsPath(space.id!);

  const openGoals = goals.filter((g) => !g.closedAt);
  const openProjects = projects.filter((p) => p.status !== "closed" && p.status !== "paused");

  return (
    <Container path={path} toolsCount={toolsCount} testId="goals-and-projects">
      <Title title="Goals & Projects" />

      {openGoals.length < 1 && openProjects.length < 1 ? (
        <ZeroGoalsAndProjects />
      ) : (
        <div className="bg-surface-dimmed rounded mx-2">
          <Goals goals={openGoals} projectsCount={openProjects.length} />
          <Projects projects={openProjects} />
        </div>
      )}
    </Container>
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
