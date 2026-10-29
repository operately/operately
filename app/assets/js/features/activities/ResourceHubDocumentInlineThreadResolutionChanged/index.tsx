import React from "react";
import type { ActivityContentResourceHubDocumentInlineThreadResolutionChanged } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";
import { Link } from "turboui";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName } from "../feedItemLinks";
import { resourceHubPathOrParent, resourceHubLocationName } from "../resourceHubActivity";

function content(activity: Activity) {
  return activity.content as ActivityContentResourceHubDocumentInlineThreadResolutionChanged;
}

const handler: ActivityHandler = {
  pageHtmlTitle: () => i18n.t("Inline comments"),
  pagePath: (paths, activity) => {
    const data = content(activity);
    return data.document
      ? `${paths.resourceHubDocumentPath(data.document.id)}?inlineThread=${encodeURIComponent(data.inlineThreadId)}`
      : resourceHubPathOrParent(paths, data);
  },
  PageTitle: () => <Trans i18nKey="Inline comments" />,
  PageContent: () => <></>,
  PageOptions: () => null,
  FeedItemTitle: ({ activity, paths }) => {
    const data = content(activity);
    const sentence = data.resolved
      ? i18n.t("{{author}} resolved a comment thread on <document>{{documentName}}</document>")
      : i18n.t("{{author}} reopened a comment thread on <document>{{documentName}}</document>");
    return (
      <Trans
        defaults={sentence}
        values={{ author: activityAuthorName(activity), documentName: data.document?.name ?? i18n.t("a document") }}
        components={{ document: <Link to={handler.pagePath(paths, activity)} /> }}
      />
    );
  },
  FeedItemContent: () => null,
  feedItemAlignment: () => "items-start",
  commentCount: () => 0,
  hasComments: () => false,
  NotificationTitle: () => i18n.t("Inline comments"),
  NotificationLocation: ({ activity }) => resourceHubLocationName(content(activity)),
};

export default handler;
