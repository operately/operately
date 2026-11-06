import React from "react";
import type { ActivityContentResourceHubDeleted } from "@/api";
import i18n from "@/i18n";
import { Link } from "turboui";
import { Trans } from "../i18n";
import { activityAuthorName } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { resourceHubPathOrParent } from "../resourceHubActivity";

const ResourceHubDeleted: ActivityHandler = {
  pageHtmlTitle: () => i18n.t("Deleted Resource Hub"),
  pagePath: (paths, activity) => resourceHubPathOrParent(paths, activity.content as ActivityContentResourceHubDeleted),
  PageTitle: () => <>{i18n.t("Deleted Resource Hub")}</>,
  PageContent: () => <></>,
  PageOptions: () => null,

  FeedItemTitle({ activity, paths }) {
    const data = activity.content as ActivityContentResourceHubDeleted;
    return (
      <Trans
        defaults={i18n.t("{{author}} deleted <collection>{{collectionName}}</collection>.")}
        values={{ author: activityAuthorName(activity), collectionName: data.name }}
        components={{ collection: <Link to={resourceHubPathOrParent(paths, data)} /> }}
      />
    );
  },

  FeedItemContent: () => null,
  feedItemAlignment: () => "items-center",
  commentCount: () => 0,
  hasComments: () => false,
  NotificationTitle: () => i18n.t("Deleted Resource Hub"),
  NotificationLocation: () => null,
};
export default ResourceHubDeleted;
