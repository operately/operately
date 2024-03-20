import * as React from "react";
import * as People from "@/models/people";

import { FeedItem, Container } from "../FeedItem";
import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";

export const ProjectGoalDisconnection: FeedItem = {
  typename: "ActivityContentProjectGoalDisconnection",
  contentQuery: `
    goal {
      id
      name
    }

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
  const goalPath = Paths.goalPath(content.goal.id);
  const projectPage = Paths.projectPath(content.project.id);

  if (page === "project") {
    return (
      <>
        {People.shortName(activity.author)} disconnected this project from the goal:{" "}
        <Link to={goalPath}>{content.goal.name}</Link>
      </>
    );
  }

  if (page === "goal") {
    return (
      <>
        {People.shortName(activity.author)} disconnected this goal from a project:{" "}
        <Link to={projectPage}>{content.project.name}</Link>
      </>
    );
  }

  if (page === "company" || page === "space" || page === "profile") {
    return (
      <>
        {People.shortName(activity.author)} disconnected the <Link to={projectPage}>{content.project.name}</Link>{" "}
        project from the <Link to={goalPath}>{content.goal.name}</Link> goal.
      </>
    );
  }

  throw new Error(`The activity feed item was rendered on an unknown page: ${page}`);
}
