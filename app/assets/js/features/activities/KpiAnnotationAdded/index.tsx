import * as React from "react";

import type { ActivityContentKpiAnnotationAdded } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, spaceLink } from "../feedItemLinks";

const KpiAnnotationAdded: ActivityHandler = {
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
      return (
        <Trans i18nKey="{{author}} added an annotation to a KPI" values={{ author: activityAuthorName(activity) }} />
      );
    }

    return (
      <Trans
        i18nKey="{{author}} added an annotation to a KPI in the <space>{{spaceName}}</space> space"
        values={{ author: activityAuthorName(activity), spaceName: data.space.name }}
        components={{ space: spaceLink(paths, data.space) }}
      />
    );
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const data = content(activity);
    const kpiName = data.kpi?.name;

    if (kpiName == null) return <Trans i18nKey="KPI: {{title}}" values={{ title: data.title }} />;

    return (
      <>
        {kpiName}: {data.title}
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
    return i18n.t("Annotated KPI: {{title}}", { title: content(activity).title });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).space?.name ?? null;
  },
};

function content(activity: Activity): ActivityContentKpiAnnotationAdded {
  return activity.content as ActivityContentKpiAnnotationAdded;
}

export default KpiAnnotationAdded;
