import React from "react";

import * as Activities from "@/graphql/Activities";
import * as Projects from "@/graphql/Projects";
import * as Icons from "@tabler/icons-react";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import RichContent from "@/components/RichContent";
import { Link } from "react-router-dom";

export default function Activity({ project }): JSX.Element {
  const { data, loading, error } = Activities.useListActivities("project", project.id);

  if (loading) return <></>;
  if (error) throw error;

  const activities = data?.activities;

  return (
    <div className="min-h-[350px] py-8">
      <SectionTitle title="Project Activity" />

      {loading && <div>Loading...</div>}
      {error && <div>{error.message}</div>}
      {data && (
        <div className="flex flex-col gap-4">
          {activities.map((activity: Activities.Activity) => (
            <ActivityItem key={activity.id} activity={activity} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityItem({ project, activity }: { project: Projects.Project; activity: Activities.Activity }) {
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
      return <ActivityItemUpdatePost project={project} activity={activity} />;
    case "update-acknowledge":
      return <ActivityItemUpdateAcknowledged activity={activity} />;
    case "comment-post":
      return <ActivityItemCommentPost activity={activity} />;
    default:
      console.log("Unknown activity type: " + activity.resourceType + "-" + activity.actionType);
      return null;
  }
}

const ContainerColors = {
  blue: {
    border: "border-blue-400/70",
    stroke: "stroke-blue-400/70",
  },
  yellow: {
    border: "border-yellow-400/50",
    stroke: "stroke-yellow-400/50",
  },
  gray: {
    border: "border-dark-8",
    stroke: "stroke-dark-8",
  },
};

function ActivityItemContainer({ person, time, children, tint = "gray" }) {
  const colors = ContainerColors[tint];

  return (
    <div className="flex items-start justify-between my-2">
      <div className="shrink-0 mt-1.5">
        <Avatar person={person} />
      </div>

      <div className={"w-full border rounded-lg relative ml-3.5 shadow-lg" + " " + colors.border}>
        <svg height="16" width="7" className="absolute" style={{ left: "-7px", top: "12px" }}>
          <polygon
            points="0,8 8,0 8,16"
            className={colors.stroke}
            style={{ fill: "var(--color-dark-4)", strokeWidth: 1 }}
          />
        </svg>

        <div className="flex flex-col overflow-hidden">
          <div className={"flex justify-between items-center"}>
            <div className="px-4 py-2">
              <span className="font-bold">{person.fullName}</span> &middot;{" "}
              <span className="text-white-2">
                <FormattedTime time={time} format="relative" />
              </span>
            </div>

            <div className="mr-3">
              <div className="border border-yellow-400/50 rounded-full px-1.5 py-0.5 text-yellow-400/70 text-xs font-medium">
                Champion
              </div>
            </div>
          </div>

          <div className="px-4 py-2 rounded-b-lg">{children}</div>

          <div className="mt-4 px-4 py-2">
            <div className="flex justify-between items-center">
              <Icons.IconMoodPlus size={24} className="text-white-2 cursor-pointer" />

              <span className="text-white-2 font-medium">0 comments</span>
            </div>

            <div className="bg-dark-2 rounded-b-lg -mx-4 -mb-2 mt-3 border-t-2 border-dark-5 text-white-2 px-4 py-4">
              Start a conversation... encourage, congratulate, or ask a question.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityItemProjectCreated({ activity }: { activity: Activities.Activity }) {
  const eventData = activity.eventData as Activities.ProjectCreateEventData;
  const champion = eventData.champion;

  if (!champion) return null;

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
      <div className="flex items-center gap-1.5">
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

function ActivityItemUpdatePost({ project, activity }: { project: Projects.Project; activity: Activities.Activity }) {
  return (
    <ActivityItemContainer person={activity.person} time={activity.insertedAt}>
      {activity.resource.messageType === "review" && <Review project={activity.resource.project} activity={activity} />}
    </ActivityItemContainer>
  );
}

import * as PhaseChange from "@/features/phase_change";

function Review({ project, activity }: { project: Projects.Project; activity: Activities.Activity }) {
  if (activity.resource.previousPhase === activity.resource.newPhase) return null;

  const handler = PhaseChange.handler(project, activity.resource.previousPhase, activity.resource.newPhase);

  const answers = JSON.parse(activity.resource.message);
  const Message = handler.activityMessage(answers);

  return <Message />;
}

// <div className="bg-shade-1 py-4 px-4 mt-4 rounded-[20px] max-w-3xl">
//   <div className="line-clamp-4">
//     <RichContent jsonContent={activity.resource.message} />
//   </div>
// </div>

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

function SectionTitle({ title }) {
  return <div className="font-bold flex items-center gap-2 py-4 border-t border-shade-1">{title}</div>;
}
