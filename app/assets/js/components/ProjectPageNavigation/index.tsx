import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";
import * as React from "react";

export function ProjectPageNavigation({ project }) {
  return <Paper.Navigation items={[{ to: DeprecatedPaths.projectPath(project.id!), label: project.name }]} />;
}

export function ProjectMilestonesNavigation({ project }: { project: Projects.Project }) {
  return (
    <Paper.Navigation
      items={[
        { to: DeprecatedPaths.projectPath(project.id!), label: project.name! },
        { to: DeprecatedPaths.projectMilestonesPath(project.id!), label: "Milestones" },
      ]}
    />
  );
}

export function ProjectContribsSubpageNavigation({ project }) {
  return (
    <Paper.Navigation
      items={[
        { to: DeprecatedPaths.projectPath(project.id!), label: project.name },
        { to: DeprecatedPaths.projectContributorsPath(project.id!), label: "Team & Access" },
      ]}
    />
  );
}

export function ProjectRetrospectiveNavigation({ project }) {
  return (
    <Paper.Navigation
      items={[
        { to: DeprecatedPaths.projectPath(project.id!), label: project.name },
        { to: DeprecatedPaths.projectRetrospectivePath(project.id!), label: "Retrospective" },
      ]}
    />
  );
}
