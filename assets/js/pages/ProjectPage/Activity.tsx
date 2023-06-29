import React from "react";

import * as Activities from "@/graphql/Activities";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import RichContent from "@/components/RichContent";
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
          <div className="flex flex-col gap-4">
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
    <div className="flex items-start justify-between border-b border-shade-1 pb-4 pt-2">
      <div className="flex items-start gap-4">
        <div className="shrink-0 -mt-1">
          <Avatar person={person} />
        </div>

        <div className="min-w-0 flex-1">{children}</div>
      </div>

      <div className="text-right w-32 shrink-0">
        <FormattedTime time={time} format="short-date" />
      </div>
    </div>
  );
}

function ActivityItemProjectCreated({ activity }: { activity: Activities.Activity }) {
  const eventData = activity.eventData as Activities.ProjectCreateEventData;
  const champion = eventData.champion;

  return (
    <ActivityItemContainer person={activity.person} time={activity.insertedAt}>
      <div className="flex items-center">
        <div className="font-medium">
          {activity.person.fullName} created this project{" "}
          {champion && <>and assigned {champion.fullName} as the champion.</>}
        </div>
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
      <div className="flex items-center">
        <div className="font-bold">
          {activity.person.fullName} added the{" "}
          <Link to={link} className="font-semibold text-blue-400 underline underline-offset-2">
            {title}
          </Link>{" "}
          milestone to this project
        </div>
      </div>
    </ActivityItemContainer>
  );
}

function ActivityItemMilestoneCompleted({ activity }: { activity: Activities.Activity }) {
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
          as completed
        </div>
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
      <div className="flex items-center">
        <div className="font-bold">
          {activity.person.fullName} posted a{" "}
          <Link to={link} className="font-semibold text-blue-400 underline underline-offset-2">
            Status Update
          </Link>
        </div>
      </div>

      <div className="mt-1 line-clamp-4">
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
          <Link to={link} className="font-semibold text-blue-400 underline underline-offset-2">
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
          <Link to={link} className="font-semibold text-blue-400 underline underline-offset-2">
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
  return <div className="border-b border-white-2 flex-1"></div>;
}

function SectionTitle({ title }) {
  return <div className="font-bold py-4 flex items-center gap-2 uppercase tracking-wide">{title}</div>;
}
