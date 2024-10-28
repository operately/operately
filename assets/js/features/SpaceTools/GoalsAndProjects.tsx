import React from "react";

import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";
import { splitByStatus } from "@/models/milestones";

import { PieChart } from "@/components/PieChart";
import { ProgressBar } from "@/components/ProgressBar";
import { MiniPieChart } from "@/components/MiniPieChart";
import { assertPresent } from "@/utils/assertions";
import { DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";

import { Container, Title } from "./components";
import { calculateGoalsStatus, calculateProjectsStatus } from "./utils";

interface GoalsAndProjectsProps {
  goals: Goal[];
  projects: Project[];
}

export function GoalsAndProjects({ goals, projects }: GoalsAndProjectsProps) {
  return (
    <Container>
      <Title title="Goals & Projects" />
      <Goals goals={goals} />
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

  const path = Paths.goalPath(goal.id!);

  return (
    <DivLink to={path} className="flex items-center gap-1 overflow-hidden">
      <div>
        <div className="w-[14px] h-[14px] bg-red-500 rounded-full" />
      </div>
      <div>
        <ProgressBar percentage={goal.progressPercentage} className="w-[50px]" />
      </div>
      <div className="truncate">{goal.name}</div>
    </DivLink>
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

  const path = Paths.projectPath(project.id!);
  const total = project.milestones.length;
  const { done } = splitByStatus(project.milestones);

  return (
    <DivLink to={path} className="flex items-center gap-1 overflow-hidden">
      <div>
        <MiniPieChart completed={done.length} total={total} />
      </div>
      <div className="truncate">{project.name}</div>
    </DivLink>
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
