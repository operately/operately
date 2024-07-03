import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";

import FormattedTime from "@/components/FormattedTime";
import { Link } from "@/components/Link";
import { Paths } from "@/routes/paths";

export default function Banner({ project }: { project: Projects.Project }) {
  const retroPath = Paths.projectRetrospectivePath(project.id!);

  if (project.status === "closed") {
    return (
      <Paper.Banner>
        This project was closed on <FormattedTime time={project.closedAt} format="long-date" />. View the{" "}
        <span className="font-bold ml-1">
          <Link to={retroPath} testId="project-retrospective-link">
            retrospective
          </Link>
        </span>
        .
      </Paper.Banner>
    );
  }

  return null;
}
