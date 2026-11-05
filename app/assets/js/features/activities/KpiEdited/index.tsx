import * as React from "react";

import type { ActivityContentKpiEdited } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { Trans } from "turboui";
import i18n from "@/i18n";
import { activityAuthorName, spaceLink } from "../feedItemLinks";

const KpiEdited: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
    const data = content(activity);
    const spaceId = data.space?.id;
    const kpiId = data.kpi?.id;

    if (!spaceId) return paths.homePath();

    return kpiId ? paths.spaceKpiPath(spaceId, kpiId) : paths.spaceKpisPath(spaceId);
  },

  PageTitle(_props: { activity: Activity }) {
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

    if (page === "space" || !data.space) {
      return <Trans i18nKey="{{author}} edited a KPI" values={{ author: activityAuthorName(activity) }} />;
    }

    return (
      <Trans
        i18nKey="{{author}} edited a KPI in the <space>{{spaceName}}</space> space"
        values={{ author: activityAuthorName(activity), spaceName: data.space.name }}
        components={{ space: spaceLink(paths, data.space) }}
      />
    );
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    return <Trans i18nKey="KPI: {{kpiName}}" values={{ kpiName: content(activity).newName }} />;
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
    return i18n.t("Edited KPI: {{kpiName}}", { kpiName: content(activity).newName });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).space?.name ?? null;
  },
};

function content(activity: Activity): ActivityContentKpiEdited {
  return activity.content as ActivityContentKpiEdited;
}

export default KpiEdited;
