import React from "react";

import * as Activities from "@/graphql/Activities";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import RichContent from "@/components/RichContent";
import { Link } from "react-router-dom";

export default function Activity({ projectId }): JSX.Element {
  const { data, loading, error } = Activities.useListActivities("project", projectId);

  if (loading) return <></>;
  if (error) throw error;

  const activityGroups = Activities.groupByDate(data?.activities);

  return (
    <div className="min-h-[350px] py-8">
      <SectionTitle title="Project Activity" />

      {loading && <div>Loading...</div>}
      {error && <div>{error.message}</div>}
      {data && (
        <div className="flex flex-col gap-16">
          {activityGroups.map((group) => (
            <ActivityGroup key={group.date} date={group.date} activities={group.activities} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityGroup({ date, activities }) {
  return (
    <div className="flex flex-col relative">
      <div className="absolute top-9 bottom-4 border-l border-shade-2 z-10" style={{ left: "99px" }} />
      <div className="border-b border-shade-2 font-bold py-2 text-sm">
        <FormattedTime time={date} format="short-date-with-weekday-relative" />
      </div>

      <div className="relative z-20">
        {activities.map((activity: Activities.Activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activities.Activity }) {
  if (activity.resource === null) return null;

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
    <div className="flex items-start justify-between p-4 gap-4">
      <div className="shrink-0 mt-1 text-sm" style={{ width: "50px" }}>
        <FormattedTime time={time} format="time-only" />
      </div>

      <div className="shrink-0">
        <Avatar person={person} />
      </div>

      <div className="flex-1 mt-1">{children}</div>
    </div>
  );
}

function ActivityItemProjectCreated({ activity }: { activity: Activities.Activity }) {
  const eventData = activity.eventData as Activities.ProjectCreateEventData;
  const champion = eventData.champion;

  const creatorIsChampion = activity.person.id === champion.id;

  const who = creatorIsChampion ? (
    <>
      <span>themself</span>
    </>
  ) : (
    <>
      <Avatar person={champion} size="tiny" /> {champion.fullName}
    </>
  );

  return (
    <ActivityItemContainer person={activity.person} time={activity.insertedAt}>
      <div className="flex items-center gap-1.5 font-bold">
        {activity.person.fullName} created this project and assigned {who} as the champion.
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
      <div className="font-semibold">
        {activity.person.fullName} added a milestone:
        <Link to={link} className="ml-1.5 font-semibold text-sky-400 underline underline-offset-2">
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

      <div className="bg-shade-1 py-4 px-4 mt-4 rounded-[20px] max-w-3xl">
        <div className="line-clamp-4">
          <RichContent jsonContent={activity.resource.message} />
        </div>
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

      <div className="bg-shade-1 py-4 px-4 mt-4 rounded-[20px] max-w-3xl">
        <div className="line-clamp-4">
          <RichContent jsonContent={JSON.parse(activity.resource.message)} />
        </div>
      </div>
    </ActivityItemContainer>
  );
}

function SeparatorLine() {
  return <div className="border-b border-white-3 flex-1"></div>;
}

function SectionTitle({ title }) {
  return <div className="font-bold flex items-center gap-2 uppercase tracking-wide py-4">{title}</div>;
}
