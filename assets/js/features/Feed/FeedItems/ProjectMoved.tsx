import * as React from "react";
import * as People from "@/models/people";

import { Container } from "../FeedItemElements";
import { Link } from "@/components/Link";

export default function ({ activity }) {
  const oldSpace = activity.content.oldSpace;
  const newName = activity.content.newSpace;

  const content = (
    <>
      From <Link to={`/spaces/${oldSpace.id}`}>{oldSpace.name}</Link> to{" "}
      <Link to={`/spaces/${newName.id}`}>{newName.name}</Link>
    </>
  );

  return (
    <Container
      title={People.shortName(activity.author) + " moved the project"}
      author={activity.author}
      time={activity.insertedAt}
      content={content}
    />
  );
}
