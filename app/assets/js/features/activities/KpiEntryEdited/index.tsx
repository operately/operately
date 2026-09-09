import * as React from "react";

import type { ActivityContentKpiEntryEdited } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { feedTitle, spaceLink } from "../feedItemLinks";

const KpiEntryEdited: ActivityHandler = {
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

    if (page === "space") {
      return feedTitle(activity, "edited a KPI update");
    }

    return feedTitle(activity, "edited a KPI update in the", spaceLink(paths, data.space), "space");
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const data = content(activity);
    const kpiName = data.kpi?.name ?? "KPI";

    return (
      <>
        {kpiName}: {data.oldValue} → {data.newValue}
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
    return `Updated ${kpiName}: ${data.oldValue} → ${data.newValue}`;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).space?.name ?? null;
  },
};

function content(activity: Activity): ActivityContentKpiEntryEdited {
  return activity.content as ActivityContentKpiEntryEdited;
}

export default KpiEntryEdited;
