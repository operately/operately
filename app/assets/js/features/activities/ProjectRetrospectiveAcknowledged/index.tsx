import type { ActivityContentProjectRetrospectiveAcknowledged } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import React from "react";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, projectLink } from "./../feedItemLinks";
import { Paths } from "@/routes/paths";

const ProjectRetrospectiveAcknowledged: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity): string {
    return paths.projectRetrospectivePath(content(activity).project!.id!);
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

    if (page === "project") {
      return (
        <Trans i18nKey="{{author}} acknowledged the retrospective" values={{ author: activityAuthorName(activity) }} />
      );
    } else {
      return (
        <Trans
          i18nKey="{{author}} acknowledged the retrospective in the <project>{{projectName}}</project> project"
          values={{ author: activityAuthorName(activity), projectName: project.name }}
          components={{ project: projectLink(paths, project) }}
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
    return i18n.t("Acknowledged retrospective");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectRetrospectiveAcknowledged {
  return activity.content as ActivityContentProjectRetrospectiveAcknowledged;
}

export default ProjectRetrospectiveAcknowledged;
