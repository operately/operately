import * as Time from "@/utils/time";
import { FormattedTime, IconFlag3Filled, Link } from "turboui";
import * as React from "react";

import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { Trans } from "../i18n";
import i18n, { tn } from "@/i18n";
import { activityAuthorName, projectLink } from "../feedItemLinks";

import type { ActivityContentProjectTimelineEdited, ActivityMilestone } from "@/api";
import type { Activity } from "@/models/activities";
import type { Paths } from "@/routes/paths";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const ProjectTimelineEdited: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    return paths.projectPath(content(activity).project!.id!);
  },

  PageTitle(_props: { activity: any }) {
    throw new Error("Not implemented");
  },

  PageContent(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    if (page === "project") {
      return <Trans i18nKey="{{author}} edited the timeline" values={{ author: activityAuthorName(activity) }} />;
    } else {
      const project = content(activity).project;
      return (
        <Trans
          i18nKey="{{author}} edited the timeline on the <project>{{projectName}}</project> project"
          values={{ author: activityAuthorName(activity), projectName: project?.name }}
          components={{ project: project ? projectLink(paths, project) : <React.Fragment /> }}
        />
      );
    }
  },

  FeedItemContent({ activity, paths }: FeedItemProps) {
    const content = prepareContent(activity.content as ActivityContentProjectTimelineEdited);

    return (
      <div className="flex-flex-col gap-1">
        <NewStartDate content={content} />
        <NewEndDate content={content} />
        <DurationChange content={content} />
        <AddedMilestones content={content} paths={paths} />
        <UpdatedMilestones content={content} paths={paths} />
      </div>
    );
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-start";
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle(_props: { activity: Activity }) {
    return i18n.t("Changed the project timeline");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectTimelineEdited {
  return activity.content as ActivityContentProjectTimelineEdited;
}

export default ProjectTimelineEdited;

function NewStartDate({ content }: { content: Content }) {
  const formattedTimePreferences = useFormattedTimePreferences();

  if (!content.startDateChanged || !content.newStartDate) return null;

  const date = <FormattedTime {...formattedTimePreferences} time={content.newStartDate} format="long-date" />;

  return (
    <div>
      <Trans i18nKey="The start date was set to <date/>." components={{ date }} />
    </div>
  );
}

function NewEndDate({ content }: { content: Content }) {
  const formattedTimePreferences = useFormattedTimePreferences();

  if (!content.dueDateChanged || !content.newDueDate) return null;

  const date = <FormattedTime {...formattedTimePreferences} time={content.newDueDate} format="long-date" />;

  return (
    <div>
      <Trans i18nKey="The due date was set to <date/>." components={{ date }} />
    </div>
  );
}

function DurationChange({ content }: { content: Content }) {
  if (!content.durationChanged) return null;

  if (content.oldDuration === null && content.newDuration !== null) {
    return (
      <div>
        {tn(
          "Total project duration is {{count}} days.",
          "Total project duration is {{count}} days.",
          content.newDuration,
        )}
      </div>
    );
  }

  if (content.oldDuration !== null && content.newDuration !== null) {
    const dir = content.durationChangeDirection;
    const percentage = content.durationChangePercentage;

    const old = content.oldDuration;
    const now = content.newDuration;

    return (
      <div>
        {dir === "increased" ? (
          <Trans
            i18nKey="Total project duration increased by {{percentage}}% ({{old}} days -> {{now}} days)."
            values={{ percentage: percentage ?? "", old, now }}
          />
        ) : dir === "decreased" ? (
          <Trans
            i18nKey="Total project duration decreased by {{percentage}}% ({{old}} days -> {{now}} days)."
            values={{ percentage: percentage ?? "", old, now }}
          />
        ) : (
          <Trans
            i18nKey="Total project duration by {{percentage}}% ({{old}} days -> {{now}} days)."
            values={{ percentage: percentage ?? "", old, now }}
          />
        )}
      </div>
    );
  }

  return null;
}

function AddedMilestones({ content, paths }: { content: Content; paths: Paths }) {
  if (!content.hasNewMilestones) return null;

  const title = tn("Added a new milestone:", "Added new milestones:", content.newMilestones.length);

  return (
    <div className="mt-2">
      {title}
      <div className="flex flex-col gap-1">
        {content.newMilestones.map((m) => (
          <MilestoneLink key={m.id} milestone={m} paths={paths} />
        ))}
      </div>
    </div>
  );
}

function UpdatedMilestones({ content, paths }: { content: Content; paths: Paths }) {
  if (!content.hasUpdatedMilestones) return null;

  const title = tn("Updated a milestone:", "Updated milestones:", content.updatedMilestones.length);

  return (
    <div className="mt-2">
      {title}
      <div className="flex flex-col gap-1">
        {content.updatedMilestones.map((m) => (
          <MilestoneLink key={m.id} milestone={m} paths={paths} />
        ))}
      </div>
    </div>
  );
}

function MilestoneLink({ milestone, paths }: { milestone: ActivityMilestone; paths: Paths }) {
  const formattedTimePreferences = useFormattedTimePreferences();
  const path = paths.projectMilestonePath(milestone.id!);
  const title = milestone.title;

  return (
    <div className="font-medium">
      <IconFlag3Filled size={14} className="inline-block mr-1" />
      <Trans
        i18nKey="<milestone>{{title}}</milestone> <separator>·</separator> Due date on <date/>"
        values={{ title }}
        components={{
          milestone: <Link to={path}>{null}</Link>,
          separator: <span className="" />,
          date: <FormattedTime {...formattedTimePreferences} time={milestone.deadlineAt!} format="long-date" />,
        }}
      />
    </div>
  );
}

interface Content {
  projectId: string;

  oldStartDate: Date | null;
  newStartDate: Date | null;
  oldDueDate: Date | null;
  newDueDate: Date | null;
  newMilestones: ActivityMilestone[];
  updatedMilestones: ActivityMilestone[];

  startDateChanged: boolean;
  dueDateChanged: boolean;

  oldDuration: number | null;
  newDuration: number | null;
  durationChanged: boolean;
  durationChangeDirection: "increased" | "decreased" | null;
  durationChangePercentage: number | null;

  hasNewMilestones: boolean;
  hasUpdatedMilestones: boolean;
}

function prepareContent(content: ActivityContentProjectTimelineEdited): Content {
  const oldStartDate = Time.parseDate(content.oldStartDate);
  const newStartDate = Time.parseDate(content.newStartDate);
  const oldEndDate = Time.parseDate(content.oldEndDate);
  const newEndDate = Time.parseDate(content.newEndDate);
  const oldDuration = calcDuration(oldStartDate, oldEndDate);
  const newDuration = calcDuration(newStartDate, newEndDate);

  const newMilestones = (content.newMilestones || []).filter((m) => m !== null) as ActivityMilestone[];
  const updatedMilestones = (content.updatedMilestones || []).filter((m) => m !== null) as ActivityMilestone[];

  return {
    projectId: content.project!.id!,

    oldStartDate: Time.parseDate(content.oldStartDate),
    newStartDate: Time.parseDate(content.newStartDate),
    oldDueDate: Time.parseDate(content.oldEndDate),
    newDueDate: Time.parseDate(content.newEndDate),

    newMilestones: newMilestones,
    updatedMilestones: updatedMilestones,

    startDateChanged: content.oldStartDate !== content.newStartDate,
    dueDateChanged: content.oldEndDate !== content.newEndDate,

    oldDuration: oldDuration,
    newDuration: newDuration,
    durationChanged: oldDuration !== newDuration,
    durationChangeDirection: calcChangeDir(oldDuration, newDuration),
    durationChangePercentage: calcPercentageChange(oldDuration, newDuration),

    hasNewMilestones: newMilestones.length > 0,
    hasUpdatedMilestones: updatedMilestones.length > 0,
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
