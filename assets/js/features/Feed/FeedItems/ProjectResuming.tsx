import * as React from "react";
import * as People from "@/models/people";

import { FeedItem, Container } from "../FeedItem";

export const ProjectResuming: FeedItem = {
  typename: "ActivityContentProjectResuming",
  contentQuery: ``,
  component: ({ activity }) => {
    return (
      <Container
        title={People.shortName(activity.author) + " resumed the project"}
        author={activity.author}
        time={activity.insertedAt}
      />
    );
  },
};
