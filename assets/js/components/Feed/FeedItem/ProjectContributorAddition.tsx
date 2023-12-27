import * as React from "react";
import * as People from "@/models/people";

import { Container } from "../FeedItemElements";

export default function ({ activity }) {
  const person = People.shortName(activity.content.person);

  return (
    <Container
      title={People.shortName(activity.author) + " added " + person + " to the project"}
      author={activity.author}
      time={activity.insertedAt}
    />
  );
}
