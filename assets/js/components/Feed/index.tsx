import * as React from "react";

import FeedItem from "./FeedItem";
import FormattedTime from "@/components/FormattedTime";

import * as Time from "@/utils/time";
import * as Activities from "@/models/activities";

export function Feed({ project }) {
  const { activities, loading, error } = Activities.useFeed(project.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div></div>;

  return (
    <div className="w-full">
      {Activities.groupByDate(activities).map((group, index) => (
        <ActivityGroup key={index} group={group} />
      ))}
    </div>
  );
}

function ActivityGroup({ group }: { group: Activities.ActivityGroup }) {
  return (
    <div className="w-full border-t border-stroke-base py-4">
      <div className="flex items-start gap-2">
        <div className="w-1/5">
          <div className="text-sm text-content-accent font-bold">
            <FormattedTime time={group.date} format="long-date" />
          </div>
          <div className="text-content-dimmed text-sm">{Time.relativeDay(group.date)}</div>
        </div>

        <div className="flex-1">
          {group.activities.map((activity) => (
            <FeedItem key={activity.id} activity={activity} />
          ))}
        </div>
      </div>
    </div>
  );
}
