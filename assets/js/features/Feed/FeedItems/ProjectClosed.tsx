import * as React from "react";
import * as People from "@/models/people";

import { Link } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { FeedItem, Container } from "../FeedItem";

export const ProjectClosed: FeedItem = {
  typename: "ActivityContentProjectClosed",
  contentQuery: `
    project {
      id
      name
    }
  `,

  component: ({ activity, content, page }) => {
    return (
      <Container
        title={<Title activity={activity} content={content} page={page} />}
        author={activity.author}
        time={activity.insertedAt}
      />
    );
  },
};

function Title({ activity, content, page }) {
  const project = <ProjectLink project={content.project} page={page} />;
  const retrospective = <RetrospectiveLink project={content.project} />;

  return (
    <>
      {People.shortName(activity.author)} closed {project} and submitted {retrospective}
    </>
  );
}

function ProjectLink({ project, page }) {
  if (page === "project") {
    return <>this project</>;
  } else {
    return <Link to={Paths.projectPath(project.id)}>{project.name}</Link>;
  }
}

function RetrospectiveLink({ project }) {
  return (
    <>
      a <Link to={Paths.projectRetrospectivePath(project.id)}>retrospective</Link>
    </>
  );
}
