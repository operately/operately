import * as React from "react";
import * as People from "@/models/people";

import { Container } from "../FeedItemElements";

export default function ({ activity }) {
  const oldName = activity.content.oldName;
  const newName = activity.content.newName;
  const content = (
    <>
      <span className="line-through">{oldName}</span> → {newName}
    </>
  );

  return (
    <Container
      title={People.shortName(activity.author) + " renamed the project"}
      author={activity.author}
      time={activity.insertedAt}
      content={content}
    />
  );
}
