import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { usePaths } from "@/routes/paths";
export function ProjectPageNavigation({ project }) {
  const paths = usePaths();
  return <Paper.Navigation items={[{ to: paths.projectPath(project.id!), label: project.name }]} />;
}

export function ProjectContribsSubpageNavigation({ project }) {
  const paths = usePaths();
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
  const paths = usePaths();
  return (
    <Paper.Navigation
      items={[
        { to: paths.projectPath(project.id!), label: project.name },
        { to: paths.projectRetrospectivePath(project.id!), label: "Retrospective" },
      ]}
    />
  );
}
