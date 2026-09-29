import * as React from "react";

import type { ActivityContentResourceHubFolderCreated } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, folderLink } from "../feedItemLinks";
import { resourceHubFolderPathOrParent, visibleParentDescriptor } from "../resourceHubActivity";

const ResourceHubFolderCreated: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const data = content(activity);

    return resourceHubFolderPathOrParent(paths, data.folder, data);
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
    const folder = data.folder ? folderLink(paths, data.folder) : <React.Fragment />;
    const parent = visibleParentDescriptor(paths, page, data);

    const sentence =
      parent?.page === "project"
        ? i18n.t(
            "{{author}} created a folder in the <parent>{{parentName}}</parent> project: <folder>{{folderName}}</folder>",
          )
        : parent?.page === "goal"
          ? i18n.t(
              "{{author}} created a folder in the <parent>{{parentName}}</parent> goal: <folder>{{folderName}}</folder>",
            )
          : parent
            ? i18n.t(
                "{{author}} created a folder in the <parent>{{parentName}}</parent> space: <folder>{{folderName}}</folder>",
              )
            : i18n.t("{{author}} created a folder: <folder>{{folderName}}</folder>");
    return (
      <Trans
        defaults={sentence}
        values={{
          author: activityAuthorName(activity),
          folderName: data.folder?.name ?? i18n.t("a folder"),
          parentName: parent?.name,
        }}
        components={{ folder, parent: parent?.link ?? <React.Fragment /> }}
      />
    );
  },

  FeedItemContent({}: { activity: Activity }) {
    return <></>;
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
    const name = content(activity).folder?.name;
    return name == null
      ? i18n.t("Created folder: a folder")
      : i18n.t("Created folder: {{folderName}}", { folderName: name });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).folder?.name ?? null;
  },
};

function content(activity: Activity): ActivityContentResourceHubFolderCreated {
  return activity.content as ActivityContentResourceHubFolderCreated;
}

export default ResourceHubFolderCreated;
