import React from "react";

import { ActivityContentProjectMilestoneUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, projectLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { DateField } from "turboui";
import { parseContextualDate } from "@/models/contextualDates";

const ProjectMilestoneUpdating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(_paths: Paths, _activity: Activity) {
    throw new Error("Not implemented");
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

  FeedItemTitle(props: FeedItemProps) {
    const { paths } = props;
    const project = content(props.activity).project!;
    const oldName = content(props.activity).oldMilestoneName!;
    const newName = content(props.activity).newMilestoneName!;

    const sentence =
      props.page === "project"
        ? oldName !== newName
          ? i18n.t("{{author}} updated the milestone {{oldName}} to {{newName}}")
          : i18n.t("{{author}} updated the milestone {{oldName}}")
        : oldName !== newName
          ? i18n.t("{{author}} updated the milestone {{oldName}} to {{newName}} in <project>{{projectName}}</project>")
          : i18n.t("{{author}} updated the milestone {{oldName}} in <project>{{projectName}}</project>");
    return (
      <Trans
        defaults={sentence}
        values={{ author: activityAuthorName(props.activity), oldName, newName, projectName: project.name }}
        components={{ project: projectLink(paths, project) }}
      />
    );
  },

  FeedItemContent(props: { activity: Activity; page: any }) {
    const data = content(props.activity);

    const oldTimeframe = data.oldTimeframe;
    const newTimeframe = data.newTimeframe;

    // No timeframes to compare
    if (!oldTimeframe && !newTimeframe) return null;

    // Added timeframe/date
    if (!oldTimeframe?.contextualEndDate && newTimeframe?.contextualEndDate) {
      return (
        <div className="text-sm text-gray-600 flex gap-1">
          <Trans
            i18nKey="Date added: <date/>"
            components={{
              date: <DateField date={parseContextualDate(newTimeframe.contextualEndDate)} readonly hideCalendarIcon />,
            }}
          />
        </div>
      );
    }

    // Removed timeframe/date
    if (oldTimeframe?.contextualEndDate && !newTimeframe?.contextualEndDate) {
      return (
        <div className="text-sm text-gray-600">
          <Trans i18nKey="Date removed" />
        </div>
      );
    }

    if (oldTimeframe?.contextualEndDate && newTimeframe?.contextualEndDate) {
      const oldDateValue = oldTimeframe.contextualEndDate.value;
      const newDateValue = newTimeframe.contextualEndDate.value;

      // Only show date change if the values are actually different
      if (oldDateValue !== newDateValue) {
        return (
          <div className="text-sm text-gray-600 flex gap-1">
            <Trans
              i18nKey="Date changed from <old/> to <new/>"
              components={{
                old: <DateField date={parseContextualDate(oldTimeframe.contextualEndDate)} readonly hideCalendarIcon />,
                new: <DateField date={parseContextualDate(newTimeframe.contextualEndDate)} readonly hideCalendarIcon />,
              }}
            />
          </div>
        );
      }
    }

    return null;
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
    return <></>;
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentProjectMilestoneUpdating {
  return activity.content as ActivityContentProjectMilestoneUpdating;
}

export default ProjectMilestoneUpdating;
