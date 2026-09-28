import React from "react";
import { Trans } from "react-i18next";
import i18n from "@/i18n";
import type { ActivityContentProjectCreated } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { activityAuthorName, projectLink } from "../feedItemLinks";

const ProjectCreated: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
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
    const project = projectLink(paths, content(activity).project!);

    if (page === "project") {
      return <Trans i18nKey="{{author}} created the project" values={{ author: activityAuthorName(activity) }} />;
    } else {
      return (
        <Trans
          i18nKey="{{author}} created the <project>{{projectName}}</project> project"
          values={{ author: activityAuthorName(activity), projectName: content(activity).project?.name }}
          components={{ project }}
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

  NotificationTitle({ activity }: { activity: Activity }) {
    return i18n.t("Added the {{projectName}} project", { projectName: content(activity).project?.name });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectCreated {
  return activity.content as ActivityContentProjectCreated;
}

export default ProjectCreated;
