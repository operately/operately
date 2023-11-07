import * as React from "react";
import * as People from "@/models/people";

import { Container } from "../FeedItemElements";

export default function ProjectCreated({ activity }) {
  return (
    <Container
      title={People.shortName(activity.author) + " created this project"}
      author={activity.author}
      time={activity.insertedAt}
    />
  );
}
