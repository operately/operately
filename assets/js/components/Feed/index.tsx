import * as React from "react";

import * as Activities from "@/models/activities";
import * as People from "@/models/people";

import { FeedItem } from "./types";

export function Feed({ project }) {
  const { activities, loading, error } = Activities.useFeed(project.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div></div>;

  return (
    <div className="w-full">
      {activities.map((activity) => (
        <FeedItem key={activity.id} person={activity.author} time={activity.insertedAt}>
          <FeedItemTitle>{People.shortName(activity.author)}</FeedItemTitle>
          <FeedItemContent>Hello</FeedItemContent>
        </FeedItem>
      ))}
    </div>
  );
}
