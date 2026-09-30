import type { ActivityContentProjectMilestoneCreation } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import React from "react";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, projectLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const ProjectMilestoneCreation: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity) {
    const { milestone, project } = content(activity);

    if (milestone) {
      return paths.projectMilestonePath(milestone.id);
    } else {
      return paths.projectPath(project.id);
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

  FeedItemTitle(props: FeedItemProps) {
    const { paths } = props;
    const project = content(props.activity).project;
    const milestoneName = content(props.activity).milestoneName;

    if (props.page === "project") {
      return (
        <Trans
          i18nKey="{{author}} added the {{milestoneName}} milestone"
          values={{ author: activityAuthorName(props.activity), milestoneName }}
        />
      );
    } else {
      return (
        <Trans
          i18nKey="{{author}} added the {{milestoneName}} milestone to <project>{{projectName}}</project>"
          values={{ author: activityAuthorName(props.activity), milestoneName, projectName: project.name }}
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

  NotificationTitle(props: { activity: Activity }) {
    const milestoneName = content(props.activity).milestoneName;
    return i18n.t('A new milestone "{{milestoneName}}" was created', { milestoneName });
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentProjectMilestoneCreation {
  return activity.content as ActivityContentProjectMilestoneCreation;
}

export default ProjectMilestoneCreation;
