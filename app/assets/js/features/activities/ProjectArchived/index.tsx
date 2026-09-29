import type { ActivityContentProjectArchived } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import React from "react";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { assertPresent } from "@/utils/assertions";
import { activityAuthorName, projectLink } from "../feedItemLinks";

const ProjectArchived: ActivityHandler = {
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
    if (page === "project") {
      return <Trans i18nKey="{{author}} archived the project" values={{ author: activityAuthorName(activity) }} />;
    } else {
      const project = content(activity).project;
      assertPresent(project, "Project is required for an archived activity");
      return (
        <Trans
          i18nKey="{{author}} archived the <project>{{projectName}}</project> project"
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

  NotificationTitle({ activity }: { activity: Activity }) {
    return i18n.t("Archived the {{projectName}} project", { projectName: content(activity).project?.name });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectArchived {
  return activity.content as ActivityContentProjectArchived;
}

export default ProjectArchived;
