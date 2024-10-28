import React, { useMemo } from "react";

import { Space } from "@/models/spaces";
import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";
import { splitByStatus } from "@/models/milestones";

import { PieChart } from "@/components/PieChart";
import { ProgressBar } from "@/components/ProgressBar";
import { MiniPieChart } from "@/components/MiniPieChart";
import { assertPresent } from "@/utils/assertions";
import { Paths } from "@/routes/paths";

import { Container, Title } from "./components";
import { calculateGoalsStatus, calculateProjectsStatus } from "./utils";

interface GoalsAndProjectsProps {
  space: Space;
  goals: Goal[];
  projects: Project[];
  toolsCount: number;
}

export function GoalsAndProjects({ space, goals, projects, toolsCount }: GoalsAndProjectsProps) {
  const path = Paths.spaceGoalsPath(space.id!);

  // Limiting the number of goals to ensure that the component
  // displays goals and projects evenly in the container.
  // With the current fixed 380px height, only 9 goals and project
  // can be displayed.
  const slicedGoals = useMemo(() => {
    if (projects.length > 4) {
      return goals.slice(0, 5);
    }
    return goals.slice(0, 9 - projects.length);
  }, []);

  return (
    <Container path={path} toolsCount={toolsCount}>
      <Title title="Goals & Projects" />
      <Goals goals={slicedGoals} />
      <Projects projects={projects} />
    </Container>
  );
}

function Goals({ goals }: { goals: Goal[] }) {
  return (
    <div className="flex flex-col gap-2 px-2 py-3">
      <Header goals={goals} type="goals" />

      {goals.map((goal) => (
        <GoalItem goal={goal} key={goal.id} />
      ))}
    </div>
  );
}

function GoalItem({ goal }: { goal: Goal }) {
  assertPresent(goal.progressPercentage, "progressPercentage");

  return (
    <div className="flex items-center gap-1 overflow-hidden">
      <div>
        <div className="w-[14px] h-[14px] bg-red-500 rounded-full" />
      </div>
      <div>
        <ProgressBar percentage={goal.progressPercentage} className="w-[50px]" />
      </div>
      <div className="truncate">{goal.name}</div>
    </div>
  );
}

function Projects({ projects }: { projects: Project[] }) {
  return (
    <div className="flex flex-col gap-2 px-2 py-3">
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

  return (
    <div className="flex items-center gap-1 overflow-hidden">
      <div>
        <MiniPieChart completed={done.length} total={total} />
      </div>
      <div className="truncate">{project.name}</div>
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
  total: number;
}

function Header(props: GoalsHeader | ProjectsHeader) {
  const status: ResourceStatus = React.useMemo(() => {
    switch (props.type) {
      case "goals":
        return calculateGoalsStatus(props.goals);
      case "projects":
        return calculateProjectsStatus(props.projects);
    }
  }, []);

  return (
    <div className="font-bold flex items-center gap-2">
      <PieChart
        total={status.total}
        slices={[
          { size: status.on_track, color: "green" },
          { size: status.caution, color: "yellow" },
          { size: status.issue, color: "red" },
        ]}
      />
      {status.on_track}/{status.total} {props.type} on track
    </div>
  );
}
