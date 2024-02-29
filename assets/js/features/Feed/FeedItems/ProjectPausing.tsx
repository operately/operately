import * as React from "react";
import * as People from "@/models/people";

import { FeedItem, Container } from "../FeedItem";

export const ProjectPausing: FeedItem = {
  typename: "ActivityContentProjectPausing",
  contentQuery: ``,
  component: ({ activity }) => {
    return (
      <Container
        title={People.shortName(activity.author) + " paused the project"}
        author={activity.author}
        time={activity.insertedAt}
      />
    );
  },
};
