import * as React from "react";
import * as People from "@/models/people";

import { FeedItem, Container } from "../FeedItem";
import { Link } from "@/components/Link";
import { Paths } from "@/routes/paths";

export const ProjectMoved: FeedItem = {
  typename: "ActivityContentProjectMoved",

  contentQuery: `
    oldSpace {
      id
      name
    }

    newSpace {
      id
      name
    }
  `,

  component: ({ activity, content }) => {
    const oldSpace = content.oldSpace;
    const newName = content.newSpace;

    const oldSpacePath = Paths.spacePath(oldSpace.id);
    const newSpacePath = Paths.spacePath(newName.id);

    const itemContent = (
      <>
        From <Link to={oldSpacePath}>{oldSpace.name}</Link> to <Link to={newSpacePath}>{newName.name}</Link>
      </>
    );

    return (
      <Container
        title={People.shortName(activity.author) + " moved the project"}
        author={activity.author}
        time={activity.insertedAt}
        content={itemContent}
      />
    );
  },
};
