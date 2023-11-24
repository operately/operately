import React from "react";

import FormattedTime from "@/components/FormattedTime";
import { Link } from "@/components/Link";
import { createPath } from "@/utils/paths";

export default function Banner({ project }) {
  const retroPath = createPath("projects", project.id, "retrospective");
  const archivePath = createPath("projects", project.id, "archive");

  if (project.isArchived && project.status !== "closed") {
    return (
      <div className="mb-8 -mx-12 -mt-12  bg-yellow-400/10 text-content-accent font-bold flex items-cennter justify-center py-4 rounded-t border-b border-surface-outline leading-none">
        This project was archived on <FormattedTime time={project.archivedAt} format="long-date" />
      </div>
    );
  }

  if (project.isArchived && project.status === "closed") {
    return (
      <div className="mb-8 -mx-12 -mt-12  bg-yellow-400/10 text-content-accent font-bold flex items-cennter justify-center py-4 rounded-t border-b border-surface-outline leading-none">
        This project was archived on <FormattedTime time={project.archivedAt} format="long-date" />. View the{" "}
        <span className="font-bold ml-1">
          <Link to={retroPath}>retrospective</Link>
        </span>
        .
      </div>
    );
  }

  if (project.status === "closed") {
    return (
      <div className="mb-8 -mx-12 -mt-12  bg-yellow-400/10 text-content-accent font-bold flex items-cennter justify-center py-4 rounded-t border-b border-surface-outline leading-none">
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
      </div>
    );
  }

  return null;
}
