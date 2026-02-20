import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";
import * as React from "react";

import { match } from "ts-pattern";
import { Link, PrimaryButton } from "turboui";

import FormattedTime from "@/components/FormattedTime";

import { usePaths } from "@/routes/paths";
export function banner(project: Projects.Project) {
  return match(project.state)
    .with("closed", () => <ProjectClosedBanner project={project} />)
    .with("paused", () => <ProjectPausedBanner project={project} />)
    .otherwise(() => null);
}

function ProjectClosedBanner({ project }: { project: Projects.Project }) {
  const paths = usePaths();
  const retroPath = paths.projectRetrospectivePath(project.id!);

  return (
    <Paper.Banner testId="project-closed-banner">
      This project was closed on <FormattedTime time={project.closedAt!} format="long-date" />. View the{" "}
      <Link to={retroPath} testId="project-retrospective-link" className="font-bold ml-1">
        retrospective
      </Link>
      .
    </Paper.Banner>
  );
}

function ProjectPausedBanner({ project }: { project: Projects.Project }) {
  const paths = usePaths();
  const resumePath = paths.resumeProjectPath(project.id!);

  return (
    <Paper.Banner testId="project-paused-banner">
      <div className="flex items-center gap-2">
        <div>This project is paused</div>
        {project.permissions?.canEdit && (
          <PrimaryButton linkTo={resumePath} testId="resume-project-button" size="xs">
            Resume
          </PrimaryButton>
        )}
      </div>
    </Paper.Banner>
  );
}
