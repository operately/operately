import type { ActivityContentResourceHubDocumentEdited } from "@/api";
import type { Activity } from "@/models/activities";
import React from "react";

import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { EditedResourceList } from "../resourceHubEditedResources";
import { resourceHubLocationName, resourceHubPathOrParent, visibleParentDescriptor } from "../resourceHubActivity";

const ResourceHubDocumentEdited: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
    const data = content(activity);

    if (data.document?.id) {
      return paths.resourceHubDocumentPath(data.document.id);
    }

    return resourceHubPathOrParent(paths, data);
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
    const resources = <EditedResourceList activity={activity} paths={paths} />;
    const parent = visibleParentDescriptor(paths, page, data);

    const sentence =
      parent?.page === "project"
        ? i18n.t("{{author}} edited <resources/> in the <parent>{{parentName}}</parent> project")
        : parent?.page === "goal"
          ? i18n.t("{{author}} edited <resources/> in the <parent>{{parentName}}</parent> goal")
          : parent
            ? i18n.t("{{author}} edited <resources/> in the <parent>{{parentName}}</parent> space")
            : i18n.t("{{author}} edited <resources/>");
    return (
      <Trans
        defaults={sentence}
        values={{ author: activityAuthorName(activity), parentName: parent?.name }}
        components={{ resources, parent: parent?.link ?? <React.Fragment /> }}
      />
    );
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
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

  NotificationTitle(_props: { activity: Activity }) {
    return i18n.t("Edited the document");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return resourceHubLocationName(content(activity));
  },
};

function content(activity: Activity): ActivityContentResourceHubDocumentEdited {
  return activity.content as ActivityContentResourceHubDocumentEdited;
}

export default ResourceHubDocumentEdited;
