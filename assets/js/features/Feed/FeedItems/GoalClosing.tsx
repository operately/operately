import * as React from "react";
import * as People from "@/models/people";

import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { match } from "ts-pattern";
import { FeedItem, Container } from "../FeedItem";
import { Page } from "../index";

export const GoalClosing: FeedItem = {
  typename: "ActivityContentGoalClosing",
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

  return match(page as Page)
    .with("goal", () => <>{People.shortName(activity.author)} completed this goal</>)
    .with("company", "space", "profile", () => (
      <>
        {People.shortName(activity.author)} completed the <Link to={goalPath}>{content.goal.name}</Link> goal
      </>
    ))
    .with("project", () => {
      throw new Error("Not supported on project page");
    })
    .exhaustive();
}
