import type { ActivityContentProjectGoalDisconnection } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import React from "react";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, goalLink, projectLink } from "../feedItemLinks";

const ProjectGoalDisconnection: ActivityHandler = {
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
    const goal = goalLink(paths, content(activity).goal!);
    const project = projectLink(paths, content(activity).project!);
    const values = {
      author: activityAuthorName(activity),
      projectName: content(activity).project?.name,
      goalName: content(activity).goal?.name,
    };

    if (page === "project") {
      return (
        <Trans
          i18nKey="{{author}} disconnected the project from the <goal>{{goalName}}</goal> goal"
          values={values}
          components={{ goal }}
        />
      );
    } else if (page === "goal") {
      return (
        <Trans
          i18nKey="{{author}} disconnected the <project>{{projectName}}</project> project from the goal"
          values={values}
          components={{ project }}
        />
      );
    } else {
      return (
        <Trans
          i18nKey="{{author}} disconnected the <project>{{projectName}}</project> project from the <goal>{{goalName}}</goal> goal"
          values={values}
          components={{ project, goal }}
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
    const projectName = content(activity).project!.name!;
    const goalName = content(activity).goal!.name!;

    return i18n.t("Disconnected the {{projectName}} project from the {{goalName}} goal", { projectName, goalName });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectGoalDisconnection {
  return activity.content as ActivityContentProjectGoalDisconnection;
}

export default ProjectGoalDisconnection;
