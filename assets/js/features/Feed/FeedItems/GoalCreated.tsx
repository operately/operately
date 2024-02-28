import * as React from "react";
import * as People from "@/models/people";

import { FeedItem, Container } from "../FeedItem";

export const GoalCreated: FeedItem = {
  typename: "ActivityContentGoalCreated",
  contentQuery: ``,

  component: ({ activity }) => {
    return (
      <Container
        title={People.shortName(activity.author) + " added this goal"}
        author={activity.author}
        time={activity.insertedAt}
      />
    );
  },
};
