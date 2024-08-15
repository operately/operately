import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";

import FormattedTime from "@/components/FormattedTime";
import { Link } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { FilledButton } from "@/components/Button";

export default function Banner({ project }: { project: Projects.Project }) {
  if (project.status === "closed") {
    return <ProjectClosedBanner project={project} />;
  }

  if (project.status === "paused") {
    return <ProjectPausedBanner project={project} />;
  }

  return null;
}

function ProjectClosedBanner({ project }: { project: Projects.Project }) {
  const retroPath = Paths.projectRetrospectivePath(project.id!);

  return (
    <Paper.Banner>
      This project was closed on <FormattedTime time={project.closedAt!} format="long-date" />. View the{" "}
      <span className="font-bold ml-1">
        <Link to={retroPath} testId="project-retrospective-link">
          retrospective
        </Link>
      </span>
      .
    </Paper.Banner>
  );
}

function ProjectPausedBanner({ project }: { project: Projects.Project }) {
  const resumePath = Paths.resumeProjectPath(project.id!);

  return (
    <Paper.Banner>
      <div className="flex items-center gap-2" data-test-id="project-paused-banner">
        <div>This project is paused</div>
        {project.permissions?.canPause && (
          <FilledButton linkTo={resumePath} testId="resume-project-button" size="xxs">
            Resume
          </FilledButton>
        )}
      </div>
    </Paper.Banner>
  );
}
