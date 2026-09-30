import React from "react";

import type { ActivityContentResourceHubFolderRenamed } from "@/api";
import type { Activity } from "@/models/activities";

import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, folderLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { resourceHubFolderPathOrParent, visibleParentDescriptor } from "../resourceHubActivity";

const ResourceHubFolderRenamed: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
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
            "{{author}} renamed the <folder>{{folderName}}</folder> folder in the <parent>{{parentName}}</parent> project",
          )
        : parent?.page === "goal"
          ? i18n.t(
              "{{author}} renamed the <folder>{{folderName}}</folder> folder in the <parent>{{parentName}}</parent> goal",
            )
          : parent
            ? i18n.t(
                "{{author}} renamed the <folder>{{folderName}}</folder> folder in the <parent>{{parentName}}</parent> space",
              )
            : i18n.t("{{author}} renamed the <folder>{{folderName}}</folder> folder");
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

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    return (
      <>
        <span className="line-through">{content(activity).oldName}</span> → {content(activity).newName}
      </>
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

  NotificationTitle({ activity }: { activity: Activity }) {
    const name = content(activity).folder?.name;
    return name == null
      ? i18n.t("Renamed a folder")
      : i18n.t("Renamed a folder: {{folderName}}", { folderName: name });
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentResourceHubFolderRenamed {
  return activity.content as ActivityContentResourceHubFolderRenamed;
}

export default ResourceHubFolderRenamed;
