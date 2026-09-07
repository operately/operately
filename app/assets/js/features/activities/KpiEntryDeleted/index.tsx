import * as React from "react";

import type { ActivityContentKpiEntryDeleted } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";
import { formatValue } from "turboui/SpaceKpisPage/utils";

import { feedTitle, spaceLink } from "../feedItemLinks";

const KpiEntryDeleted: ActivityHandler = {
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

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    const data = content(activity);

    if (page === "space") {
      return feedTitle(activity, "deleted a KPI update");
    }

    return feedTitle(activity, "deleted a KPI update in the", spaceLink(data.space), "space");
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const data = content(activity);
    const kpiName = data.kpi?.name ?? "KPI";

    return (
      <>
        {kpiName}: {formatValue(data.value, data.kpi?.unit)}
      </>
    );
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
    const data = content(activity);
    const kpiName = data.kpi?.name ?? "KPI";
    return `Deleted an update from ${kpiName}: ${formatValue(data.value, data.kpi?.unit)}`;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).space?.name ?? null;
  },
};

function content(activity: Activity): ActivityContentKpiEntryDeleted {
  return activity.content as ActivityContentKpiEntryDeleted;
}

export default KpiEntryDeleted;
