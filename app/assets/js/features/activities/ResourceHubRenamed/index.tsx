import React from "react";

import type { ActivityContentResourceHubRenamed } from "@/api";
import type { Activity } from "@/models/activities";
import i18n from "@/i18n";
import { Link } from "turboui";
import { Trans } from "../i18n";
import { activityAuthorName } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { resourceHubPathOrParent, visibleParentDescriptor } from "../resourceHubActivity";

const ResourceHubRenamed: ActivityHandler = {
  pageHtmlTitle: () => i18n.t("Renamed Resource Hub"),
  pagePath: (paths, activity) => resourceHubPathOrParent(paths, content(activity)),
  PageTitle: () => <>{i18n.t("Renamed Resource Hub")}</>,
  PageContent: ({ activity }) => <NameChange activity={activity} />,
  PageOptions: () => null,

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    const data = content(activity);
    const parent = visibleParentDescriptor(paths, page, data);
    const sentence = parent
      ? i18n.t(
          "{{author}} renamed <collection>{{collectionName}}</collection> in the <parent>{{parentName}}</parent> space.",
        )
      : i18n.t("{{author}} renamed <collection>{{collectionName}}</collection>.");

    return (
      <Trans
        defaults={sentence}
        values={{ author: activityAuthorName(activity), collectionName: data.newName, parentName: parent?.name }}
        components={{
          collection: <Link to={resourceHubPathOrParent(paths, data)} />,
          parent: parent?.link ?? <React.Fragment />,
        }}
      />
    );
  },
  FeedItemContent: ({ activity }) => <NameChange activity={activity} />,
  feedItemAlignment: () => "items-center",
  commentCount: () => 0,
  hasComments: () => false,
  NotificationTitle: () => i18n.t("Renamed Resource Hub"),
  NotificationLocation: () => null,
};

function NameChange({ activity }: { activity: Activity }) {
  const data = content(activity);
  return (
    <>
      <span className="line-through">{data.oldName}</span> → {data.newName}
    </>
  );
}

function content(activity: Activity): ActivityContentResourceHubRenamed {
  return activity.content as ActivityContentResourceHubRenamed;
}

export default ResourceHubRenamed;
