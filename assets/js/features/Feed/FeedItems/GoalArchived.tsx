import * as React from "react";
import * as People from "@/models/people";

import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { FeedItem, Container } from "../FeedItem";

export const GoalArchived: FeedItem = {
  typename: "ActivityContentGoalArchived",
  contentQuery: `
    goal {
      id
      name
    }
  `,

  component: ({ activity, content, page }) => {
    return (
      <Container
        title={<Title activity={activity} page={page} content={content} />}
        author={activity.author}
        time={activity.insertedAt}
      />
    );
  },
};

function Title({ activity, content, page }) {
  const goalPath = Paths.goalPath(content.goal.id);

  if (page === "goal") {
    return <>{People.shortName(activity.author)} archived this goal</>;
  }

  if (page === "company" || page === "space" || page === "profile") {
    return (
      <>
        {People.shortName(activity.author)} archived the <Link to={goalPath}>{content.goal.name}</Link> goal
      </>
    );
  }

  throw new Error(`Invalid page: ${page}`);
}
