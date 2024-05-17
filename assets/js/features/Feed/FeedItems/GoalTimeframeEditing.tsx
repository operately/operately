import * as React from "react";

import { FeedItem, Container } from "../FeedItem";

export const GoalTimeframeEditing: FeedItem = {
  typename: "ActivityContentGoalTimeframeEditing",

  contentQuery: `
    goal {
      id
      name
    }

    oldTimeframe {
      startDate
      endDate
      type
    }

    newTimeframe {
      startDate
      endDate
      type
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
