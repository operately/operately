import * as React from "react";

import type { ActivityContentKpiCreated } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, spaceLink } from "../feedItemLinks";

const KpiCreated: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
    const data = content(activity);
    const spaceId = data.space?.id;
    const kpiId = data.kpi?.id;

    if (!spaceId) return paths.homePath();

    // Activities recorded before KPIs had their own page carry no KPI id.
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

    if (page === "space") {
      return <Trans i18nKey="{{author}} created a KPI" values={{ author: activityAuthorName(activity) }} />;
    }

    return (
      <Trans
        i18nKey="{{author}} created a KPI in the <space>{{spaceName}}</space> space"
        values={{ author: activityAuthorName(activity), spaceName: data.space.name }}
        components={{ space: spaceLink(paths, data.space) }}
      />
    );
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    return <Trans i18nKey="KPI: {{kpiName}}" values={{ kpiName: content(activity).kpiName }} />;
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
    return i18n.t("Created KPI: {{kpiName}}", { kpiName: content(activity).kpiName });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).space?.name ?? null;
  },
};

function content(activity: Activity): ActivityContentKpiCreated {
  return activity.content as ActivityContentKpiCreated;
}

export default KpiCreated;
