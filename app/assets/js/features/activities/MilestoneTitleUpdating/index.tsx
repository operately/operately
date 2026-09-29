import React from "react";

import type { ActivityContentMilestoneTitleUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, milestoneLink, projectLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const MilestoneTitleUpdating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity) {
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
    const { project, milestone, newTitle } = content(activity);
    const title = milestone ? milestoneLink(paths, milestone, newTitle) : <React.Fragment />;
    const values = {
      author: activityAuthorName(activity),
      title: milestone ? newTitle || milestone.title : `"${newTitle}"`,
      projectName: project.name,
    };

    if (page === "project") {
      return (
        <Trans
          i18nKey="{{author}} renamed milestone to <milestone>{{title}}</milestone>"
          values={values}
          components={{ milestone: title }}
        />
      );
    } else {
      return (
        <Trans
          i18nKey="{{author}} renamed milestone to <milestone>{{title}}</milestone> in <project>{{projectName}}</project>"
          values={values}
          components={{ milestone: title, project: projectLink(paths, project) }}
        />
      );
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const { oldTitle } = content(activity);

    return (
      <Trans
        i18nKey={'Previously, the milestone was called <name>"{{oldTitle}}"</name>.'}
        values={{ oldTitle }}
        components={{ name: <strong /> }}
      />
    );
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
    const { newTitle } = content(props.activity);

    return i18n.t('Milestone was renamed to "{{newTitle}}"', { newTitle });
  },

  NotificationLocation(props: { activity: Activity }) {
    return content(props.activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentMilestoneTitleUpdating {
  return activity.content as ActivityContentMilestoneTitleUpdating;
}

export default MilestoneTitleUpdating;
