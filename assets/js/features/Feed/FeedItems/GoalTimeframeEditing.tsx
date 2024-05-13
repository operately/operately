import * as React from "react";

import { FeedItem, Container } from "../FeedItem";
import { FeedItemTitle, FeedItemContent } from "@/features/activities";

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
        title={<FeedItemTitle activity={activity} content={content} page={page} />}
        author={activity.author}
        time={activity.insertedAt}
        content={<FeedItemContent activity={activity} content={content} page={page} />}
      />
    );
  },
};
