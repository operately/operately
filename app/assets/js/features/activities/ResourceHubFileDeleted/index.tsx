import type { ActivityContentResourceHubFileDeleted } from "@/api";
import type { Activity } from "@/models/activities";

import React from "react";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, resourceHubLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { resourceHubLocationName, resourceHubPathOrParent, visibleParentDescriptor } from "../resourceHubActivity";

const ResourceHubFileDeleted: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
    return resourceHubPathOrParent(paths, content(activity));
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
    const resourceHub = data.resourceHub ? (
      resourceHubLink(paths, data.resourceHub, { project: data.project, goal: data.goal })
    ) : (
      <React.Fragment />
    );
    const fileName = data.file?.name ?? i18n.t("a file");
    const parent = visibleParentDescriptor(paths, page, data);

    const sentence =
      parent?.page === "project"
        ? i18n.t(
            '{{author}} deleted "{{fileName}}" from <hub>{{hubName}}</hub> in the <parent>{{parentName}}</parent> project',
          )
        : parent?.page === "goal"
          ? i18n.t(
              '{{author}} deleted "{{fileName}}" from <hub>{{hubName}}</hub> in the <parent>{{parentName}}</parent> goal',
            )
          : parent
            ? i18n.t(
                '{{author}} deleted "{{fileName}}" from <hub>{{hubName}}</hub> in the <parent>{{parentName}}</parent> space',
              )
            : i18n.t('{{author}} deleted "{{fileName}}" from <hub>{{hubName}}</hub>');
    return (
      <Trans
        defaults={sentence}
        values={{
          author: activityAuthorName(activity),
          fileName,
          hubName: data.resourceHub?.name ?? i18n.t("Docs & Files"),
          parentName: parent?.name,
        }}
        components={{ hub: resourceHub, parent: parent?.link ?? <React.Fragment /> }}
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
    const name = content(activity).file?.name;
    return name == null ? i18n.t("Deleted a file") : i18n.t("Deleted a file: {{fileName}}", { fileName: name });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return resourceHubLocationName(content(activity));
  },
};

function content(activity: Activity): ActivityContentResourceHubFileDeleted {
  return activity.content as ActivityContentResourceHubFileDeleted;
}

export default ResourceHubFileDeleted;
