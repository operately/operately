import * as React from "react";

import type { ActivityContentKpiCreated } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { feedTitle, spaceLink } from "../feedItemLinks";

const KpiCreated: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
    const spaceId = content(activity).space?.id;

    return spaceId ? paths.spaceKpisPath(spaceId) : paths.homePath();
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
      return feedTitle(activity, "created a KPI");
    }

    return feedTitle(activity, "created a KPI in the", spaceLink(data.space), "space");
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    return <>KPI: {content(activity).kpiName}</>;
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
    return `Created KPI: ${content(activity).kpiName}`;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).space?.name ?? null;
  },
};

function content(activity: Activity): ActivityContentKpiCreated {
  return activity.content as ActivityContentKpiCreated;
}

export default KpiCreated;
