import type { ActivityContentProjectGoalConnection } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import React from "react";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, goalLink, projectLink } from "../feedItemLinks";

const ProjectGoalConnection: ActivityHandler = {
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
    const data = content(activity);
    const { project: p, goal: g, previousGoal } = data;
    const connectedGoalName = currentGoalName(data);
    const disconnectedGoalName = previousGoalName(data);

    const project = projectLink(paths, p);

    const values = { author: activityAuthorName(activity), projectName: p.name };
    if (g || connectedGoalName) {
      const sentence =
        page === "project"
          ? i18n.t("{{author}} connected the project to the <goal>{{goalName}}</goal> goal")
          : page === "goal" && g
            ? i18n.t("{{author}} connected the <project>{{projectName}}</project> project to the goal")
            : i18n.t(
                "{{author}} connected the <project>{{projectName}}</project> project to the <goal>{{goalName}}</goal> goal",
              );
      return (
        <Trans
          defaults={sentence}
          values={{ ...values, goalName: connectedGoalName }}
          components={{ project, goal: g ? goalLink(paths, g) : <React.Fragment /> }}
        />
      );
    }
    if (previousGoal || disconnectedGoalName) {
      const sentence =
        page === "project"
          ? i18n.t("{{author}} disconnected the project from the <goal>{{goalName}}</goal> goal")
          : i18n.t(
              "{{author}} disconnected the <project>{{projectName}}</project> project from the <goal>{{goalName}}</goal> goal",
            );
      return (
        <Trans
          defaults={sentence}
          values={{ ...values, goalName: disconnectedGoalName }}
          components={{ project, goal: previousGoal ? goalLink(paths, previousGoal) : <React.Fragment /> }}
        />
      );
    }
    return page === "project" ? (
      <Trans i18nKey="{{author}} disconnected the project from its parent goal" values={values} />
    ) : (
      <Trans
        i18nKey="{{author}} disconnected the <project>{{projectName}}</project> project from its parent goal"
        values={values}
        components={{ project }}
      />
    );
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
    const data = content(activity);
    const projectName = data.project?.name;
    const connectedGoalName = currentGoalName(data);
    const disconnectedGoalName = previousGoalName(data);

    if (connectedGoalName) {
      return projectName
        ? i18n.t("Connected {{projectName}} project to the {{goalName}} goal", {
            projectName,
            goalName: connectedGoalName,
          })
        : i18n.t("Connected a project to the {{goalName}} goal", { goalName: connectedGoalName });
    }

    if (disconnectedGoalName) {
      return projectName
        ? i18n.t("Disconnected {{projectName}} project from the {{goalName}} goal", {
            projectName,
            goalName: disconnectedGoalName,
          })
        : i18n.t("Disconnected a project from the {{goalName}} goal", { goalName: disconnectedGoalName });
    }

    return projectName
      ? i18n.t("Updated the parent goal of {{projectName}} project", { projectName })
      : i18n.t("Updated a project's parent goal");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    const data = content(activity);

    return data.project?.name ?? currentGoalName(data) ?? previousGoalName(data);
  },
};

function content(activity: Activity): ActivityContentProjectGoalConnection {
  return activity.content as ActivityContentProjectGoalConnection;
}

function currentGoalName(content: ActivityContentProjectGoalConnection): string | null {
  return content.goal?.name ?? content.goalName;
}

function previousGoalName(content: ActivityContentProjectGoalConnection): string | null {
  return content.previousGoal?.name ?? content.previousGoalName;
}

export default ProjectGoalConnection;
