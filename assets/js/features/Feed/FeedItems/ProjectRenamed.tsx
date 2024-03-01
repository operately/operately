import * as React from "react";
import * as People from "@/models/people";

import { FeedItem, Container } from "../FeedItem";

export const ProjectRenamed: FeedItem = {
  typename: "ActivityContentProjectRenamed",

  contentQuery: `
    oldName
    newName
  `,

  component: ({ activity, content }) => {
    const oldName = content.oldName;
    const newName = content.newName;
    const itemContent = (
      <>
        <span className="line-through">{oldName}</span> → {newName}
      </>
    );

    return (
      <Container
        title={People.shortName(activity.author) + " renamed the project"}
        author={activity.author}
        time={activity.insertedAt}
        content={itemContent}
      />
    );
  },
};
