import type { ActivityContentMilestoneDeleting } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import React from "react";
import { Trans } from "../i18n";
import { activityAuthorName, projectLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const MilestoneDeleting: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(_paths: Paths, _activity: Activity) {
    throw new Error("Not implemented");
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
    const { milestoneName, project } = content(props.activity);

    if (props.page === "project") {
      return (
        <Trans
          i18nKey={'{{author}} deleted the "{{milestoneName}}" milestone'}
          values={{ author: activityAuthorName(props.activity), milestoneName }}
        />
      );
    } else {
      return (
        <Trans
          i18nKey={'{{author}} deleted the "{{milestoneName}}" milestone in <project>{{projectName}}</project>'}
          values={{ author: activityAuthorName(props.activity), milestoneName, projectName: project.name }}
          components={{ project: projectLink(paths, project) }}
        />
      );
    }
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null; // No additional content needed for deletion
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
    const { milestoneName } = content(props.activity);
    return <Trans i18nKey={'Milestone "{{milestoneName}}" was deleted'} values={{ milestoneName }} />;
  },

  NotificationLocation(props: { activity: Activity }) {
    const { project } = content(props.activity);

    return <Trans i18nKey="Project: {{projectName}}" values={{ projectName: project?.name }} />;
  },
};

function content(activity: Activity): ActivityContentMilestoneDeleting {
  return activity.content as ActivityContentMilestoneDeleting;
}

export default MilestoneDeleting;
