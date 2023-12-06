import React from "react";

import FormattedTime from "@/components/FormattedTime";
import { Link } from "@/components/Link";
import { createPath } from "@/utils/paths";
import * as Paper from "@/components/PaperContainer";

export default function Banner({ project }) {
  const retroPath = createPath("projects", project.id, "retrospective");
  const archivePath = createPath("projects", project.id, "archive");

  if (project.isArchived && project.status !== "closed") {
    return (
      <Paper.Banner>
        This project was archived on <FormattedTime time={project.archivedAt} format="long-date" />
      </Paper.Banner>
    );
  }

  if (project.isArchived && project.status === "closed") {
    return (
      <Paper.Banner>
        This project was archived on <FormattedTime time={project.archivedAt} format="long-date" />. View the{" "}
        <span className="font-bold ml-1">
          <Link to={retroPath}>retrospective</Link>
        </span>
        .
      </Paper.Banner>
    );
  }

  if (project.status === "closed") {
    return (
      <Paper.Banner>
        This project was closed on <FormattedTime time={project.closedAt} format="long-date" />. View the{" "}
        <span className="font-bold ml-1">
          <Link to={retroPath} testId="project-retrospective-link">
            retrospective
          </Link>
        </span>
        <span className="ml-1">or</span>
        <span className="font-bold ml-1">
          <Link to={archivePath}>archive the project</Link>
        </span>
        .
      </Paper.Banner>
    );
  }

  return null;
}
