import React from "react";

import * as Activities from "@/graphql/Activities";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import RichContent from "@/components/RichContent";
import { Link } from "react-router-dom";

export default function Activity({ projectId }): JSX.Element {
  const { data, loading, error } = Activities.useListActivities("project", projectId);

  return (
    <div className="rounded-b-[20px] bg-dark-2 min-h-[350px] border-t border-shade-1 py-8">
      <SectionTitle title="Project Activity" />

      {loading && <div>Loading...</div>}
      {error && <div>{error.message}</div>}
      {data && (
        <div className="flex flex-col relative">
          <div className="absolute top-4 bottom-4 left-20 border-l border-shade-2 z-10" />

          <div className="relative z-20">
            {data.activities.map((activity: Activities.Activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activities.Activity }) {
  switch (activity.resourceType + "-" + activity.actionType) {
    case "project-create":
      return <ActivityItemProjectCreated activity={activity} />;
    case "milestone-create":
      return <ActivityItemMilestoneCreated activity={activity} />;
    case "milestone-complete":
      return <ActivityItemMilestoneCompleted activity={activity} />;
    case "milestone-uncomplete":
      return <ActivityItemMilestoneUnCompleted activity={activity} />;
    case "update-post":
      return <ActivityItemUpdatePost activity={activity} />;
    case "update-acknowledge":
      return <ActivityItemUpdateAcknowledged activity={activity} />;
    case "comment-post":
      return <ActivityItemCommentPost activity={activity} />;
    default:
      console.log("Unknown activity type: " + activity.resourceType + "-" + activity.actionType);
      return null;
  }
}

function ActivityItemContainer({ person, time, children }) {
  return (
    <div className="flex items-start justify-between p-4 px-16 gap-4">
      <div className="shrink-0">
        <Avatar person={person} />
      </div>

      <div className="flex-1 mt-1">{children}</div>

      <div className="shrink-0 mt-1">
        at <FormattedTime time={time} format="short-date" />
      </div>
    </div>
  );
}

function ActivityItemProjectCreated({ activity }: { activity: Activities.Activity }) {
  const eventData = activity.eventData as Activities.ProjectCreateEventData;
  const champion = eventData.champion;

  return (
    <ActivityItemContainer person={activity.person} time={activity.insertedAt}>
      <div className="flex items-center gap-1.5 font-bold">
        {activity.person.fullName} created this project and assigned <Avatar person={champion} size="tiny" />{" "}
        {champion.fullName} as the champion.
      </div>
    </ActivityItemContainer>
  );
}

function ActivityItemMilestoneCreated({ activity }: { activity: Activities.Activity }) {
  const eventData = activity.eventData as Activities.MilestoneCreateEventData;
  const link = `/projects/${activity.scopeId}/milestones`;
  const title = eventData.title;

  return (
    <ActivityItemContainer person={activity.person} time={activity.insertedAt}>
      <div className="flex items-center gap-1.5 font-semibold">
        {activity.person.fullName} added a milestone:
        <Link to={link} className="font-semibold text-sky-400 underline underline-offset-2">
          {title}
        </Link>
      </div>
    </ActivityItemContainer>
  );
}

function ActivityItemMilestoneCompleted({ activity }: { activity: Activities.Activity }) {
  const link = `/projects/${activity.scopeId}/milestones`;
  const title = activity.resource.title;

  return (
    <ActivityItemContainer person={activity.person} time={activity.insertedAt}>
      <div className="flex items-center gap-1.5 font-semibold">
        {activity.person.fullName} checked off:
        <Link to={link} className="font-semibold text-sky-400 underline underline-offset-2">
          {title}
        </Link>
      </div>
    </ActivityItemContainer>
  );
}

function ActivityItemMilestoneUnCompleted({ activity }: { activity: Activities.Activity }) {
  const link = `/projects/${activity.scopeId}/milestones`;
  const title = activity.resource.title;

  return (
    <ActivityItemContainer person={activity.person} time={activity.insertedAt}>
      <div className="flex items-center">
        <div className="font-bold">
          {activity.person.fullName} marked the{" "}
          <Link to={link} className="font-semibold text-blue-400 underline underline-offset-2">
            {title}
          </Link>{" "}
          as pending
        </div>
      </div>
    </ActivityItemContainer>
  );
}

function ActivityItemUpdatePost({ activity }: { activity: Activities.Activity }) {
  const link = `/projects/${activity.scopeId}/updates/${activity.resource.id}`;

  return (
    <ActivityItemContainer person={activity.person} time={activity.insertedAt}>
      <div className="flex items-center gap-1.5 font-semibold">
        {activity.person.fullName} posted a:
        <Link to={link} className="font-semibold text-sky-400 underline underline-offset-2">
          Status Update
        </Link>
      </div>

      <div className="line-clamp-4 mt-2">
        <RichContent jsonContent={activity.resource.message} />
      </div>
    </ActivityItemContainer>
  );
}

function ActivityItemUpdateAcknowledged({ activity }: { activity: Activities.Activity }) {
  const link = `/projects/${activity.scopeId}/updates/${activity.resource.id}`;

  return (
    <ActivityItemContainer person={activity.person} time={activity.insertedAt}>
      <div className="flex items-center">
        <div className="font-bold">
          {activity.person.fullName} acknowledged the{" "}
          <Link to={link} className="font-semibold text-sky-400 underline underline-offset-2">
            Status Update
          </Link>
        </div>
      </div>
    </ActivityItemContainer>
  );
}

function ActivityItemCommentPost({ activity }: { activity: Activities.Activity }) {
  const eventData = activity.eventData as Activities.CommentPostEventData;
  const link = `/projects/${activity.scopeId}/updates/${eventData.updateId}`;

  return (
    <ActivityItemContainer person={activity.person} time={activity.insertedAt}>
      <div className="flex items-center">
        <div className="font-bold">
          {activity.person.fullName} posted a comment on a{" "}
          <Link to={link} className="font-semibold text-sky-400 underline underline-offset-2">
            Status Update
          </Link>
        </div>
      </div>

      <div className="mt-1 line-clamp-4">
        <RichContent jsonContent={JSON.parse(activity.resource.message)} />
      </div>
    </ActivityItemContainer>
  );
}

function SeparatorLine() {
  return <div className="border-b border-white-3 flex-1"></div>;
}

function SectionTitle({ title }) {
  return <div className="font-bold flex items-center gap-2 uppercase tracking-wide py-4 px-16">{title}</div>;
}
