import * as React from "react";
import * as People from "@/models/people";

import { FeedItem, Container } from "../FeedItem";

export const ProjectContributorAddition: FeedItem = {
  typename: "ActivityContentProjectContributorAddition",

  contentQuery: `
    person {
      id
      fullName
    }
  `,

  component: ({ activity, content }) => {
    const person = People.shortName(content.person);

    return (
      <Container
        title={People.shortName(activity.author) + " added " + person + " to the project"}
        author={activity.author}
        time={activity.insertedAt}
      />
    );
  },
};
