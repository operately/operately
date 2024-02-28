import * as React from "react";
import * as People from "@/models/people";

import { FeedItem, Container } from "../FeedItem";

export const ProjectArchived: FeedItem = {
  typename: "ActivityContentProjectArchived",

  contentQuery: `
    projectId
  `,

  component: ({ activity }) => {
    return (
      <Container
        title={People.shortName(activity.author) + " archived this project"}
        author={activity.author}
        time={activity.insertedAt}
      />
    );
  },
};
