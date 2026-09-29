import type { ActivityContentProjectKeyResourceDeleted } from "@/api";
import type { Activity } from "@/models/activities";
import React from "react";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, projectLink } from "../feedItemLinks";

const ProjectKeyResourceAdded: ActivityHandler = {
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
      return (
        <Trans
          i18nKey="{{author}} deleted a key resource from the project"
          values={{ author: activityAuthorName(activity) }}
        />
      );
    } else {
      const project = content(activity).project;
      return (
        <Trans
          i18nKey="{{author}} deleted a key resource from the <project>{{projectName}}</project> project"
          values={{ author: activityAuthorName(activity), projectName: project?.name }}
          components={{ project: project ? projectLink(paths, project) : <React.Fragment /> }}
        />
      );
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const title = content(activity).title;

    if (!title) return <></>;

    return (
      <div>
        <Trans i18nKey="Resource:" />
        <ul className="ml-4 list-disc">
          <li>{content(activity).title}</li>
        </ul>
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

  NotificationTitle({ activity }: { activity: Activity }) {
    return i18n.t("Deleted a key resource from the {{projectName}} project", {
      projectName: content(activity).project?.name,
    });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectKeyResourceDeleted {
  return activity.content as ActivityContentProjectKeyResourceDeleted;
}

export default ProjectKeyResourceAdded;
