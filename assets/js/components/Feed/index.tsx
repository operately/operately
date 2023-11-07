import * as React from "react";

import * as Activities from "@/models/activities";

import FeedItem from "./FeedItem";

export function Feed({ project }) {
  const { activities, loading, error } = Activities.useFeed(project.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div></div>;

  return (
    <div className="w-full">
      {activities.map((activity) => (
        <FeedItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
