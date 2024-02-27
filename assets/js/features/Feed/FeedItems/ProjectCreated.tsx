import * as React from "react";
import * as People from "@/models/people";

import { FeedItem, Container } from "../FeedItem";

export const ProjectCreated: FeedItem = {
  typename: "ActivityContentProjectCreated",

  contentQuery: `
    project {
      id
      name
    }
  `,

  component: ({ activity }) => {
    return (
      <Container
        title={People.shortName(activity.author) + " created this project"}
        author={activity.author}
        time={activity.insertedAt}
      />
    );
  },
};
