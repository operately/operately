import React from "react";

import * as People from "@/models/people";

import { Link } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { FeedItem, Container } from "../FeedItem";

export const SpaceJoining: FeedItem = {
  typename: "ActivityContentSpaceJoining",
  contentQuery: `
    space {
      id
      name
    }
  `,
  component: ({ activity, content, page }) => {
    return (
      <Container
        title={<Title activity={activity} page={page} content={content} />}
        author={activity.author}
        time={activity.insertedAt}
      />
    );
  },
};

function Title({ activity, page, content }) {
  const spacePath = Paths.spacePath(content.space.id);

  if (page === "space") {
    return <>{People.shortName(activity.author)} joined this space</>;
  }

  if (page === "company" || "profile") {
    return (
      <>
        {People.shortName(activity.author)} joined the <Link to={spacePath}>{content.space.name}</Link> space
      </>
    );
  }

  throw new Error("Unsupported page type: " + page);
}
