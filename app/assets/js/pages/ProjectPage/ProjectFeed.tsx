import * as Projects from "@/models/projects";
import * as React from "react";

import { Feed, useItemsQuery } from "@/features/Feed";

export function ProjectFeed({ project }: { project: Projects.Project }) {
  return (
    <div>
      <div className="uppercase text-xs text-content-accent font-semibold mb-4">Project Activity</div>
      <ProjectFeedItems project={project} />
    </div>
  );
}

function ProjectFeedItems({ project }) {
  const { data, loading, error } = useItemsQuery("project", project.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <Feed items={data!.activities!} testId="project-feed" page="project" />;
}
