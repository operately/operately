import React from "react";

import type { ActivityContentMilestoneDueDateUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { feedTitle, milestoneLink, projectLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { DateField } from "turboui";
import { parseContextualDate } from "@/models/contextualDates";

const MilestoneDueDateUpdating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity) {
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

  FeedItemTitle({ activity, page }: { activity: Activity; page: string }) {
    const { project, milestone, milestoneName, newDueDate } = content(activity);
    const title = milestone ? milestoneLink(milestone, milestoneName) : `"${milestoneName}"`;

    const message = newDueDate ? ["updated the due date for the", title, "milestone"] : ["removed due date from the", title, "milestone"];

    if (page === "project") {
      return feedTitle(activity, ...message);
    } else {
      return feedTitle(activity, ...message, "in", projectLink(project));
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const { oldDueDate, newDueDate } = content(activity);

    if (!oldDueDate && newDueDate) {
      return (
        <span>
          Due date was set to{" "}
          <span className="inline-block">
            <DateField date={parseContextualDate(newDueDate)} readonly hideCalendarIcon />
          </span>
          .
        </span>
      );
    }

    if (oldDueDate && !newDueDate) {
      return (
        <span>
          Due date{" "}
          <span className="inline-block">
            <DateField date={parseContextualDate(oldDueDate)} readonly hideCalendarIcon />
          </span>{" "}
          was removed.
        </span>
      );
    }

    if (oldDueDate && newDueDate) {
      return (
        <span>
          Due date was changed from{" "}
          <span className="inline-block">
            <DateField date={parseContextualDate(oldDueDate)} readonly hideCalendarIcon />
          </span>{" "}
          to{" "}
          <span className="inline-block">
            <DateField date={parseContextualDate(newDueDate)} readonly hideCalendarIcon />
          </span>
          .
        </span>
      );
    }

    return <>Due date was updated.</>;
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-center";
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle(props: { activity: Activity }) {
    const { milestone, newDueDate } = content(props.activity);

    if (newDueDate) {
      return `The "${milestone?.title}" milestone due date was updated`;
    } else {
      return `The "${milestone?.title}" milestone due date was removed`;
    }
  },

  NotificationLocation(props: { activity: Activity }) {
    return content(props.activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentMilestoneDueDateUpdating {
  return activity.content as ActivityContentMilestoneDueDateUpdating;
}

export default MilestoneDueDateUpdating;
