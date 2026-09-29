import type { ActivityContentResourceHubDocumentPublicSharingChanged } from "@/api";
import React from "react";
import type { Activity } from "@/models/activities";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, documentLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { resourceHubLocationName, resourceHubPathOrParent, visibleParentDescriptor } from "../resourceHubActivity";

function content(activity: Activity) {
  return activity.content as ActivityContentResourceHubDocumentPublicSharingChanged;
}

const handler: ActivityHandler = {
  pageHtmlTitle: () => i18n.t("Document public sharing"),
  pagePath: (paths, activity) => {
    const data = content(activity);
    return data.document ? paths.resourceHubDocumentPath(data.document.id) : resourceHubPathOrParent(paths, data);
  },
  PageTitle: () => <Trans i18nKey="Document public sharing" />,
  PageContent: () => <></>,
  PageOptions: () => null,
  FeedItemTitle: ({ activity, page, paths }) => {
    const data = content(activity);
    const document = data.document ? documentLink(paths, data.document) : <React.Fragment />;
    const parent = visibleParentDescriptor(paths, page, data);
    const values = {
      author: activityAuthorName(activity),
      documentName: data.document?.name ?? i18n.t("a document"),
      parentName: parent?.name,
    };
    const components = { document, parent: parent?.link ?? <React.Fragment /> };
    if (data.enabled) {
      const sentence =
        parent?.page === "project"
          ? i18n.t(
              "{{author}} enabled public sharing for <document>{{documentName}}</document> in the <parent>{{parentName}}</parent> project",
            )
          : parent?.page === "goal"
            ? i18n.t(
                "{{author}} enabled public sharing for <document>{{documentName}}</document> in the <parent>{{parentName}}</parent> goal",
              )
            : parent
              ? i18n.t(
                  "{{author}} enabled public sharing for <document>{{documentName}}</document> in the <parent>{{parentName}}</parent> space",
                )
              : i18n.t("{{author}} enabled public sharing for <document>{{documentName}}</document>");
      return <Trans defaults={sentence} values={values} components={components} />;
    }
    const sentence =
      parent?.page === "project"
        ? i18n.t(
            "{{author}} disabled public sharing for <document>{{documentName}}</document> in the <parent>{{parentName}}</parent> project",
          )
        : parent?.page === "goal"
          ? i18n.t(
              "{{author}} disabled public sharing for <document>{{documentName}}</document> in the <parent>{{parentName}}</parent> goal",
            )
          : parent
            ? i18n.t(
                "{{author}} disabled public sharing for <document>{{documentName}}</document> in the <parent>{{parentName}}</parent> space",
              )
            : i18n.t("{{author}} disabled public sharing for <document>{{documentName}}</document>");
    return <Trans defaults={sentence} values={values} components={components} />;
  },
  FeedItemContent: () => null,
  feedItemAlignment: () => "items-start",
  commentCount: () => 0,
  hasComments: () => false,
  NotificationTitle: ({ activity }) =>
    content(activity).enabled ? i18n.t("Enabled public sharing") : i18n.t("Disabled public sharing"),
  NotificationLocation: ({ activity }) => resourceHubLocationName(content(activity)),
};

export default handler;
