import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";

import { Feed, useItemsQuery } from "@/features/Feed";

export function ProjectFeed({ project }: { project: Projects.Project }) {
  return (
    <Paper.DimmedSection>
      <div className="uppercase text-xs text-content-accent font-semibold mb-4">Project Activity</div>
      <ProjectFeedItems project={project} />
    </Paper.DimmedSection>
  );
}

function ProjectFeedItems({ project }) {
  const { data, loading, error } = useItemsQuery("project", project.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <Feed items={data!.activities!} testId="project-feed" page="project" />;
}
