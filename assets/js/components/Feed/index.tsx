import * as React from "react";

import Avatar from "@/components/Avatar";
import * as Activities from "@/models/activities";
import * as People from "@/models/people";
import FormattedTime from "@/components/FormattedTime";

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

function FeedItem({ person, time, children }) {
  return (
    <div className="flex w-full">
      <div className="w-full pr-2 py-3">
        <div className="flex items-start gap-3">
          <Avatar person={person} size="small" />
          <div className="flex-1">{children}</div>
          <FeedItemTime time={time} />
        </div>
      </div>
    </div>
  );
}

function FeedItemTime({ time }) {
  return (
    <div className="shrink-0 text-xs text-white-2 mt-2 w-12 text-right">
      <FormattedTime time={time} format="time-only" />
    </div>
  );
}

function FeedItemTitle({ children }) {
  return <div className="text-sm w-full font-bold text-white-1">{children}</div>;
}

function FeedItemContent({ children }) {
  return <div className="text-sm w-full mt-1">{children}</div>;
}
