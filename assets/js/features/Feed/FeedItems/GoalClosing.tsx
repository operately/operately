import * as React from "react";
import * as People from "@/models/people";

import { FeedItem, Container } from "../FeedItem";
import { GoalLink } from "../shared/GoalLink";

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
  return (
    <>
      {People.shortName(activity.author)} closed <GoalLink goal={content.goal} page={page} showOnGoalPage />
    </>
  );
}
