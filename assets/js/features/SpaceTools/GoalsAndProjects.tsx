import React from "react";

import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";

import { Container, Title } from "./components";
import { calculateGoalsStatus, calculateProjectsStatus } from "./utils";
import { PieChart } from "@/components/PieChart";

interface GoalsAndProjectsProps {
  goals: Goal[];
  projects: Project[];
}

export function GoalsAndProjects({ goals, projects }: GoalsAndProjectsProps) {
  return (
    <Container>
      <Title title="Goals & Projects" />

      <Header goals={goals} type="goals" />

      <Header projects={projects} type="projects" />
    </Container>
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
    <div className="font-bold flex items-center gap-2 py-3 px-2">
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
