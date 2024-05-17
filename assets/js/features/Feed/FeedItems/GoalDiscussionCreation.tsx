import * as React from "react";

import { FeedItem, Container } from "../FeedItem";
import ActivityHandler from "@/features/activities";

export const GoalDiscussionCreation: FeedItem = {
  typename: "ActivityContentGoalDiscussionCreation",

  contentQuery: `
    goal {
      id
      name
    }
  `,

  component: ({ activity, content, page }) => {
    return (
      <Container
        title={<ActivityHandler.FeedItemTitle activity={activity} content={content} page={page} />}
        author={activity.author}
        time={activity.insertedAt}
        content={<ActivityHandler.FeedItemContent activity={activity} content={content} page={page} />}
      />
    );
  },
};
