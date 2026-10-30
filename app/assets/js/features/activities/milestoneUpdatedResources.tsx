import type * as Api from "@/api";
import { useLocale } from "@/contexts/TimezoneContext";
import i18n from "@/i18n";
import { getAggregatedActivities } from "@/models/activities";
import type { Activity } from "@/models/activities";
import type { Paths } from "@/routes/paths";
import React from "react";
import { ActivityResourceList, type ActivityResourceEntry } from "turboui";
import { activityAuthorName, projectLink } from "./feedItemLinks";
import { Trans } from "./i18n";
import type { FeedItemProps } from "./interfaces";

type MilestoneContent =
  | Api.ActivityContentProjectMilestoneCreation
  | Api.ActivityContentProjectMilestoneUpdating
  | Api.ActivityContentMilestoneTitleUpdating
  | Api.ActivityContentMilestoneDueDateUpdating
  | Api.ActivityContentMilestoneDeleting
  | Api.ActivityContentProjectMilestoneCommented;

export function hasAggregatedMilestones(activity: Activity) {
  return getAggregatedActivities(activity).length > 1;
}

export function updatedMilestonesForFeed(
  activity: Activity,
  paths: Paths,
  detail?: (activity: Activity) => React.ReactNode,
): ActivityResourceEntry[] {
  const seenActivities = new Set<string>();
  return getAggregatedActivities(activity)
    .slice()
    .sort((a, b) => (a.insertedAt ?? "").localeCompare(b.insertedAt ?? ""))
    .filter((entry) => {
      if (!entry.id) return true;
      if (seenActivities.has(entry.id)) return false;
      seenActivities.add(entry.id);
      return true;
    })
    .map((entry, index) => {
      const content = entry.content as MilestoneContent;
      const milestone = entry.action !== "milestone_deleting" && "milestone" in content ? content.milestone : null;
      const name = milestoneName(entry);
      return {
        key: milestone?.id ?? `activity:${entry.id ?? index}`,
        name: name ?? i18n.t("a milestone"),
        path: milestone?.id ? paths.projectMilestonePath(milestone.id) : undefined,
        details: detail ? (
          <span key={entry.id ?? index} className="block">
            {detail(entry)}
          </span>
        ) : undefined,
      };
    });
}

function milestoneName(activity: Activity): string | undefined {
  switch (activity.action) {
    case "milestone_title_updating": {
      const content = activity.content as Api.ActivityContentMilestoneTitleUpdating;
      return content.newTitle || content.milestone?.title;
    }
    case "project_milestone_updating":
      return (activity.content as Api.ActivityContentProjectMilestoneUpdating).newMilestoneName;
    case "milestone_deleting":
      return (activity.content as Api.ActivityContentMilestoneDeleting).milestoneName;
    case "project_milestone_creation": {
      const content = activity.content as Api.ActivityContentProjectMilestoneCreation;
      return content.milestoneName || content.milestone?.title;
    }
    case "milestone_due_date_updating": {
      const content = activity.content as Api.ActivityContentMilestoneDueDateUpdating;
      return content.milestoneName || content.milestone?.title;
    }
    default:
      return (activity.content as Api.ActivityContentProjectMilestoneCommented).milestone?.title;
  }
}

export function UpdatedMilestoneGroup({
  activity,
  paths,
  page,
  detail,
}: FeedItemProps & { detail?: (activity: Activity) => React.ReactNode }) {
  const locale = useLocale();
  const content = activity.content as MilestoneContent;
  const sentence = groupedSentence(activity, page === "project");
  return (
    <Trans
      defaults={sentence}
      values={{ author: activityAuthorName(activity), projectName: content.project.name }}
      components={{
        milestones: (
          <ActivityResourceList entries={updatedMilestonesForFeed(activity, paths, detail)} locale={locale} />
        ),
        project: projectLink(paths, content.project),
      }}
    />
  );
}

function groupedSentence(activity: Activity, inProject: boolean): string {
  switch (activity.action) {
    case "project_milestone_creation":
      return inProject
        ? i18n.t("{{author}} added milestones <milestones/>")
        : i18n.t("{{author}} added milestones <milestones/> in <project>{{projectName}}</project>");
    case "milestone_deleting":
      return inProject
        ? i18n.t("{{author}} deleted milestones <milestones/>")
        : i18n.t("{{author}} deleted milestones <milestones/> in <project>{{projectName}}</project>");
    case "milestone_title_updating":
      return inProject
        ? i18n.t("{{author}} renamed milestones <milestones/>")
        : i18n.t("{{author}} renamed milestones <milestones/> in <project>{{projectName}}</project>");
    case "milestone_due_date_updating":
      return inProject
        ? i18n.t("{{author}} updated due dates for milestones <milestones/>")
        : i18n.t("{{author}} updated due dates for milestones <milestones/> in <project>{{projectName}}</project>");
    case "project_milestone_commented": {
      const content = activity.content as Api.ActivityContentProjectMilestoneCommented;
      return content.commentAction === "complete"
        ? inProject
          ? i18n.t("{{author}} completed milestones <milestones/>")
          : i18n.t("{{author}} completed milestones <milestones/> in <project>{{projectName}}</project>")
        : inProject
          ? i18n.t("{{author}} reopened milestones <milestones/>")
          : i18n.t("{{author}} reopened milestones <milestones/> in <project>{{projectName}}</project>");
    }
    default:
      return inProject
        ? i18n.t("{{author}} updated milestones <milestones/>")
        : i18n.t("{{author}} updated milestones <milestones/> in <project>{{projectName}}</project>");
  }
}
