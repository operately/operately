import * as React from "react";
import * as People from "@/models/people";
import { Link } from "@/components/Link";

import { Container } from "../FeedItemElements";
import { createPath } from "@/utils/paths";

export default function ({ activity, page }) {
  return (
    <Container title={<Title activity={activity} page={page} />} author={activity.author} time={activity.insertedAt} />
  );
}

function Title({ activity, page }) {
  const goal = activity.content.goal;
  const project = activity.content.project;

  const goalPath = createPath("goals", goal.id);
  const projectPage = createPath("projects", project.id);

  if (page === "project") {
    return (
      <>
        {People.shortName(activity.author)} disconnected this project from the goal:{" "}
        <Link to={goalPath}>{goal.name}</Link>
      </>
    );
  }

  if (page === "goal") {
    return (
      <>
        {People.shortName(activity.author)} disconnected this goal from a project:{" "}
        <Link to={projectPage}>{project.name}</Link>
      </>
    );
  }

  throw new Error(`The activity feed item was rendered on an unknown page: ${page}`);
}
