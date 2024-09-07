import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";

import { Link } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { PrimaryButton } from "@/components/Buttons";
import { match } from "ts-pattern";

import FormattedTime from "@/components/FormattedTime";

export function Banner({ project }: { project: Projects.Project }) {
  return match(project.status)
    .with("closed", () => <ProjectClosedBanner project={project} />)
    .with("paused", () => <ProjectPausedBanner project={project} />)
    .otherwise(() => null);
}

function ProjectClosedBanner({ project }: { project: Projects.Project }) {
  const retroPath = Paths.projectRetrospectivePath(project.id!);

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
  const resumePath = Paths.resumeProjectPath(project.id!);

  return (
    <Paper.Banner testId="project-paused-banner">
      <div className="flex items-center gap-2">
        <div>This project is paused</div>
        {project.permissions?.canPause && (
          <PrimaryButton linkTo={resumePath} testId="resume-project-button" size="xxs">
            Resume
          </PrimaryButton>
        )}
      </div>
    </Paper.Banner>
  );
}
