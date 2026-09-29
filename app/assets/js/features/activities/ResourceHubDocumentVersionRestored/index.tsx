import type { ActivityContentResourceHubDocumentVersionRestored } from "@/api";
import type { Activity } from "@/models/activities";

import React from "react";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, documentLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { resourceHubLocationName, resourceHubPathOrParent, visibleParentDescriptor } from "../resourceHubActivity";

const ResourceHubDocumentVersionRestored: ActivityHandler = {
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
    const document = data.document;
    const parent = visibleParentDescriptor(paths, page, data);

    if (!document) {
      return (
        <Trans
          i18nKey="{{author}} restored a document to a previous version"
          values={{ author: activityAuthorName(activity) }}
        />
      );
    }

    const doc = documentLink(paths, document);

    const sentence =
      parent?.page === "project"
        ? i18n.t(
            "{{author}} restored <document>{{documentName}}</document> to a previous version in the <parent>{{parentName}}</parent> project",
          )
        : parent?.page === "goal"
          ? i18n.t(
              "{{author}} restored <document>{{documentName}}</document> to a previous version in the <parent>{{parentName}}</parent> goal",
            )
          : parent
            ? i18n.t(
                "{{author}} restored <document>{{documentName}}</document> to a previous version in the <parent>{{parentName}}</parent> space",
              )
            : i18n.t("{{author}} restored <document>{{documentName}}</document> to a previous version");
    return (
      <Trans
        defaults={sentence}
        values={{ author: activityAuthorName(activity), documentName: document.name, parentName: parent?.name }}
        components={{ document: doc, parent: parent?.link ?? <React.Fragment /> }}
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
    return i18n.t("Restored a document version");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return resourceHubLocationName(content(activity));
  },
};

function content(activity: Activity): ActivityContentResourceHubDocumentVersionRestored {
  return activity.content as ActivityContentResourceHubDocumentVersionRestored;
}

export default ResourceHubDocumentVersionRestored;
