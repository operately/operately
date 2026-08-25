import * as React from "react";

import type { ActivityContentKpiAnnotationDeleted } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { feedTitle, spaceLink } from "../feedItemLinks";

const KpiAnnotationDeleted: ActivityHandler = {
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
      return feedTitle(activity, "removed a KPI annotation");
    }

    return feedTitle(activity, "removed a KPI annotation in the", spaceLink(data.space), "space");
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    return <>{content(activity).title}</>;
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
    return `Removed KPI annotation: ${content(activity).title}`;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).space?.name ?? null;
  },
};

function content(activity: Activity): ActivityContentKpiAnnotationDeleted {
  return activity.content as ActivityContentKpiAnnotationDeleted;
}

export default KpiAnnotationDeleted;
