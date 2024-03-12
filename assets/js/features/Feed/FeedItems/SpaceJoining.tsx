import React from "react";

import * as People from "@/models/people";
import * as Activities from "@/models/activities";

import { FeedItem, Container } from "../FeedItem";

export const SpaceJoining: FeedItem = {
  typename: "ActivityContentSpaceJoining",
  contentQuery: ``,
  component: ({ activity, page }) => {
    return <Container title={title(activity, page)} author={activity.author} time={activity.insertedAt} />;
  },
};

function title(activity: Activities.Activity, page: string) {
  if (page === "space") {
    return People.shortName(activity.author) + " joined this space";
  }

  throw new Error("Unsupported page type: " + page);
}
