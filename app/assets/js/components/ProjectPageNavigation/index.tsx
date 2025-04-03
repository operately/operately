import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";

import { Paths } from "@/routes/paths";

export function ProjectPageNavigation({ project }) {
  return <Paper.Navigation items={[{ to: Paths.projectPath(project.id!), label: project.name }]} />;
}

export function ProjectMilestonesNavigation({ project }: { project: Projects.Project }) {
  return (
    <Paper.Navigation
      items={[
        { to: Paths.projectPath(project.id!), label: project.name! },
        { to: Paths.projectMilestonesPath(project.id!), label: "Milestones" },
      ]}
    />
  );
}

export function ProjectContribsSubpageNavigation({ project }) {
  return (
    <Paper.Navigation
      items={[
        { to: Paths.projectPath(project.id!), label: project.name },
        { to: Paths.projectContributorsPath(project.id!), label: "Team & Access" },
      ]}
    />
  );
}

export function ProjectRetrospectiveNavigation({ project }) {
  return (
    <Paper.Navigation
      items={[
        { to: Paths.projectPath(project.id!), label: project.name },
        { to: Paths.projectRetrospectivePath(project.id!), label: "Retrospective" },
      ]}
    />
  );
}
