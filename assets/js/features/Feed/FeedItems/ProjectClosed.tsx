import * as React from "react";
import * as People from "@/models/people";

import { FeedItem, Container } from "../FeedItem";

export const ProjectClosed: FeedItem = {
  typename: "ActivityContentProjectClosed",
  contentQuery: ``,

  component: ({ activity }) => {
    return (
      <Container
        title={People.shortName(activity.author) + " closed this project and submitted a retrospective"}
        author={activity.author}
        time={activity.insertedAt}
      />
    );
  },
};
