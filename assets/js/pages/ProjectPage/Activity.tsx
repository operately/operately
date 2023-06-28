import React from "react";

import * as Activities from "@/graphql/Activities";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import { Link } from "react-router-dom";

export default function Activity({ projectId }): JSX.Element {
  const { data, loading, error } = Activities.useListActivities("project", projectId);

  return (
    <div className="px-16 rounded-b-[20px] py-8 bg-dark-2 min-h-[350px] border-t border-shade-1">
      <div className="">
        <div className="flex items-center justify-between gap-4">
          <SeparatorLine />
          <SectionTitle title="Project Activity" />
          <SeparatorLine />
        </div>

        {loading && <div>Loading...</div>}
        {error && <div>{error.message}</div>}
        {data && (
          <div>
            {data.activities.map((activity: Activities.Activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activities.Activity }) {
  console.log(activity.resourceType + "-" + activity.actionType);

  switch (activity.resourceType + "-" + activity.actionType) {
    case "project-create":
      return <ActivityItemProjectCreated activity={activity} />;
    case "milestone-create":
      return <ActivityItemMilestoneCreated activity={activity} />;
    default:
      return null;
  }
}

function ActivityItemProjectCreated({ activity }: { activity: Activities.Activity }) {
  const eventData = activity.eventData as Activities.ProjectCreateEventData;
  const champion = eventData.champion;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <Avatar person={activity.person} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center">
            <div className="font-medium">
              {activity.person.fullName} created this project{" "}
              {champion && <>and assigned {champion.fullName} as the champion.</>}
            </div>
          </div>
        </div>
      </div>

      <div className="text-right w-32">
        <FormattedTime time={activity.insertedAt} format="short-date" />
      </div>
    </div>
  );
}

function ActivityItemMilestoneCreated({ activity }: { activity: Activities.Activity }) {
  const eventData = activity.eventData as Activities.MilestoneCreateEventData;
  const link = `/projects/${activity.scopeId}/milestones`;
  const title = eventData.title;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <Avatar person={activity.person} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center">
            <div className="font-medium">
              {activity.person.fullName} added the{" "}
              <Link to={link} className="font-bold text-blue-400 underline underline-offset-2">
                {title}
              </Link>{" "}
              milestone to this project
            </div>
          </div>
        </div>
      </div>

      <div className="text-right w-32">
        <FormattedTime time={activity.insertedAt} format="short-date" />
      </div>
    </div>
  );
}

function SeparatorLine() {
  return <div className="border-b border-white-2 flex-1"></div>;
}

function SectionTitle({ title }) {
  return <div className="font-bold py-4 flex items-center gap-2 uppercase tracking-wide">{title}</div>;
}
