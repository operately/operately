import * as React from "react";
import * as People from "@/models/people";
import * as Time from "@/utils/time";
import * as Activities from "@/models/activities";
import * as Milestones from "@/graphql/Projects/milestones";
import * as Icons from "@tabler/icons-react";

import FormattedTime from "@/components/FormattedTime";

import { Link } from "@/components/Link";
import { Container } from "../FeedItemElements";

export default function ({ activity }) {
  return (
    <Container
      title={People.shortName(activity.author) + " edited the timeline"}
      author={activity.author}
      time={activity.insertedAt}
      content={<Content activity={activity} />}
    />
  );
}

function Content({ activity }) {
  const content = prepareContent(activity.content);

  return (
    <div className="flex-flex-col gap-1">
      <NewStartDate content={content} />
      <NewEndDate content={content} />
      <DurationChange content={content} />
      <AddedMilestones content={content} />
    </div>
  );
}

function NewStartDate({ content }: { content: Content }) {
  if (!content.startDateChanged) return null;

  const date = <FormattedTime time={content.newStartDate!} format="long-date" />;

  return <div>The start date was set to {date}.</div>;
}

function NewEndDate({ content }: { content: Content }) {
  if (!content.dueDateChanged) return null;

  const date = <FormattedTime time={content.newDueDate!} format="long-date" />;

  return <div>The due date was set to {date}.</div>;
}

function DurationChange({ content }: { content: Content }) {
  if (!content.durationChanged) return null;

  if (content.oldDuration === null && content.newDuration !== null) {
    return <div>Total project duration is {content.newDuration} days.</div>;
  }

  if (content.oldDuration !== null && content.newDuration !== null) {
    const dir = content.durationChangeDirection;
    const percentage = content.durationChangePercentage;

    const old = content.oldDuration;
    const now = content.newDuration;

    return (
      <div>
        Total project duration {dir} by {percentage}% ({old} days -&gt; {now} days).
      </div>
    );
  }

  return null;
}

function AddedMilestones({ content }: { content: Content }) {
  if (!content.hasNewMilestones) return null;

  const title = content.newMilestones.length === 1 ? "Added a new milestone" : "Added new milestones";

  return (
    <div className="mt-2">
      {title}:
      <div className="flex flex-col gap-1">
        {content.newMilestones.map((m) => (
          <AddedNewMilestoneLink key={m.id} projectId={content.projectId} milestone={m} />
        ))}
      </div>
    </div>
  );
}

function AddedNewMilestoneLink({ projectId, milestone }: { projectId: string; milestone: Milestones.Milestone }) {
  const path = `/projects/${projectId}/milestones/${milestone.id}`;
  const title = milestone.title;

  return (
    <div className="flex items-center gap-1 font-medium">
      <Icons.IconFlagFilled size={14} className="text-yellow-400" />
      <Link to={path}>{title}</Link> &middot; Due date on{" "}
      <FormattedTime time={milestone.deadlineAt} format="long-date" />
    </div>
  );
}

interface Content {
  projectId: string;

  oldStartDate: Date | null;
  newStartDate: Date | null;
  oldDueDate: Date | null;
  newDueDate: Date | null;
  newMilestones: Milestones.Milestone[];

  startDateChanged: boolean;
  dueDateChanged: boolean;

  oldDuration: number | null;
  newDuration: number | null;
  durationChanged: boolean;
  durationChangeDirection: "increased" | "decreased" | null;
  durationChangePercentage: number | null;

  hasNewMilestones: boolean;
}

function prepareContent(content: Activities.ActivityContentProjectTimelineEdited): Content {
  const oldStartDate = Time.parseDate(content.oldStartDate);
  const newStartDate = Time.parseDate(content.newStartDate);
  const oldEndDate = Time.parseDate(content.oldEndDate);
  const newEndDate = Time.parseDate(content.newEndDate);
  const oldDuration = calcDuration(oldStartDate, oldEndDate);
  const newDuration = calcDuration(newStartDate, newEndDate);

  const newMilestones = (content.newMilestones || []).filter((m) => m !== null) as Milestones.Milestone[];

  return {
    projectId: content.project.id,

    oldStartDate: Time.parseDate(content.oldStartDate),
    newStartDate: Time.parseDate(content.newStartDate),
    oldDueDate: Time.parseDate(content.oldEndDate),
    newDueDate: Time.parseDate(content.newEndDate),
    newMilestones: newMilestones,

    startDateChanged: content.oldStartDate !== content.newStartDate,
    dueDateChanged: content.oldEndDate !== content.newEndDate,

    oldDuration: oldDuration,
    newDuration: newDuration,
    durationChanged: oldDuration !== newDuration,
    durationChangeDirection: calcChangeDir(oldDuration, newDuration),
    durationChangePercentage: calcPercentageChange(oldDuration, newDuration),

    hasNewMilestones: newMilestones.length > 0,
  };
}

function calcDuration(oldStartDate: Date | null, oldEndDate: Date | null): number | null {
  if (!oldStartDate) return null;
  if (!oldEndDate) return null;

  return Time.daysBetween(oldStartDate, oldEndDate);
}

function calcPercentageChange(oldValue: number | null, newValue: number | null): number | null {
  if (!oldValue) return null;
  if (!newValue) return null;

  return Math.round((Math.abs(newValue - oldValue) / oldValue) * 100);
}

function calcChangeDir(oldValue: number | null, newValue: number | null): "increased" | "decreased" | null {
  if (!oldValue) return null;
  if (!newValue) return null;

  if (newValue === oldValue) return null;
  if (newValue > oldValue) return "increased";
  if (newValue < oldValue) return "decreased";

  return null;
}
