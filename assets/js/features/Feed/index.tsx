import * as React from "react";

export { useItemsQuery } from "./useItemsQuery";

import FormattedTime from "@/components/FormattedTime";
import FeedItems from "./FeedItems";

import * as Time from "@/utils/time";
import * as Activities from "@/models/activities";

export function Feed({ items, testId }: { items: Activities.Activity[]; testId?: string }) {
  return (
    <div className="w-full" data-test-id={testId}>
      {Activities.groupByDate(items).map((group, index) => (
        <ActivityGroup key={index} group={group} page="project" />
      ))}
    </div>
  );
}

function ActivityGroup({ group, page }: { group: Activities.ActivityGroup; page: string }) {
  return (
    <div className="w-full border-t border-stroke-base py-4">
      <div className="flex items-start gap-2">
        <div className="w-1/5">
          <div className="text-sm text-content-accent font-bold">
            <FormattedTime time={group.date} format="long-date" />
          </div>
          <div className="text-content-dimmed text-sm">{Time.relativeDay(group.date)}</div>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          {group.activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} page={page} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ activity, page }: { activity: Activities.Activity; page: string }) {
  const item = FeedItems.find((item) => item.typename === activity.content.__typename);

  if (!item) {
    console.log(`No component found for feed item type: ${activity.content.__typename}`);
    return null;
  }

  const content = activity.content;
  return React.createElement(item.component, { activity, content, page });
}
