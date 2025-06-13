import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";
import * as React from "react";

import { usePaths } from "@/routes/paths";
export function ProjectPageNavigation({ project }) {
  return <Paper.Navigation items={[{ to: paths.projectPath(project.id!), label: project.name }]} />;
}

export function ProjectMilestonesNavigation({ project }: { project: Projects.Project }) {
  return (
    <Paper.Navigation
      items={[
        { to: paths.projectPath(project.id!), label: project.name! },
        { to: paths.projectMilestonesPath(project.id!), label: "Milestones" },
      ]}
    />
  );
}

export function ProjectContribsSubpageNavigation({ project }) {
  return (
    <Paper.Navigation
      items={[
        { to: paths.projectPath(project.id!), label: project.name },
        { to: paths.projectContributorsPath(project.id!), label: "Team & Access" },
      ]}
    />
  );
}

export function ProjectRetrospectiveNavigation({ project }) {
  return (
    <Paper.Navigation
      items={[
        { to: paths.projectPath(project.id!), label: project.name },
        { to: paths.projectRetrospectivePath(project.id!), label: "Retrospective" },
      ]}
    />
  );
}
