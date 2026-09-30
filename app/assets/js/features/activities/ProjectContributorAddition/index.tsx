import * as People from "@/models/people";

import type { ActivityContentProjectContributorAddition } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import React from "react";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, projectLink } from "./../feedItemLinks";

const ProjectContributorAddition: ActivityHandler = {
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
    const { person, project } = content(activity);
    const personName = person ? People.firstName(person) : i18n.t("a contributor");

    if (page === "project") {
      return (
        <Trans
          i18nKey="{{author}} added {{personName}} to the project"
          values={{ author: activityAuthorName(activity), personName }}
        />
      );
    } else {
      return project ? (
        <Trans
          i18nKey="{{author}} added {{personName}} to the <project>{{projectName}}</project> project"
          values={{ author: activityAuthorName(activity), personName, projectName: project.name }}
          components={{ project: projectLink(paths, project) }}
        />
      ) : (
        <Trans
          i18nKey="{{author}} added {{personName}} to a project"
          values={{ author: activityAuthorName(activity), personName }}
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
    return i18n.t("Added you as a contributor");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectContributorAddition {
  return activity.content as ActivityContentProjectContributorAddition;
}

export default ProjectContributorAddition;
