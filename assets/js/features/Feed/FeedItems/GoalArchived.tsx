import * as React from "react";
import * as People from "@/models/people";

import { FeedItem, Container } from "../FeedItem";

export const GoalArchived: FeedItem = {
  typename: "ActivityContentGoalArchived",
  contentQuery: ``,

  component: ({ activity }) => {
    return (
      <Container
        title={People.shortName(activity.author) + " archived this goal"}
        author={activity.author}
        time={activity.insertedAt}
      />
    );
  },
};
