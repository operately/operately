import type { ActivityContentProjectCheckInAcknowledged } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import React from "react";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, projectCheckInLink, projectLink } from "./../feedItemLinks";

const ProjectCheckInAcknowledged: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { checkIn, project } = content(activity);

    if (checkIn?.id) {
      return paths.projectCheckInPath(checkIn.id);
    } else {
      return paths.projectPath(project!.id);
    }
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
    const project = content(activity).project!;
    const checkInLink = projectCheckInLink(paths, content(activity).checkIn);
    const checkIn = typeof checkInLink === "string" ? <React.Fragment /> : checkInLink;

    if (page === "project") {
      return (
        <Trans
          i18nKey="{{author}} acknowledged a <checkIn>Check-In</checkIn>"
          values={{ author: activityAuthorName(activity) }}
          components={{ checkIn }}
        />
      );
    } else {
      return (
        <Trans
          i18nKey="{{author}} acknowledged a <checkIn>Check-In</checkIn> in the <project>{{projectName}}</project> project"
          values={{ author: activityAuthorName(activity), projectName: project.name }}
          components={{ checkIn, project: projectLink(paths, project) }}
        />
      );
    }
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
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

  NotificationTitle(_props: { activity: Activity }) {
    return i18n.t("Acknowledged check-in");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectCheckInAcknowledged {
  return activity.content as ActivityContentProjectCheckInAcknowledged;
}

export default ProjectCheckInAcknowledged;
