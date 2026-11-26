import React from "react";
import { Link } from "turboui";

import type { ActivityContentKpiGoalLinkChanged } from "@/api";
import type { Activity } from "@/models/activities";
import { activityAuthorName } from "../feedItemLinks";
import { Trans } from "../i18n";
import type { ActivityHandler } from "../interfaces";

function content(activity: Activity) {
  return activity.content as ActivityContentKpiGoalLinkChanged;
}

const KpiGoalLinkChanged: ActivityHandler = {
  pagePath(paths, activity) {
    const { space, kpi } = content(activity);
    return kpi ? paths.spaceKpiPath(space.id, kpi.id) : paths.spaceKpisPath(space.id);
  },
  pageHtmlTitle: (activity) => content(activity).kpiName,
  PageTitle: ({ activity }) => <>{content(activity).kpiName}</>,
  PageContent: () => <></>,
  PageOptions: () => null,

  FeedItemTitle({ activity, paths }) {
    const { linked, space, kpi, kpiName } = content(activity);
    const values = { author: activityAuthorName(activity), kpiName };
    const components = { kpi: kpi ? <Link to={paths.spaceKpiPath(space.id, kpi.id)} /> : <React.Fragment /> };

    return linked ? (
      <Trans
        i18nKey="{{author}} linked the KPI <kpi>{{kpiName}}</kpi> to a goal"
        values={values}
        components={components}
      />
    ) : (
      <Trans
        i18nKey="{{author}} unlinked the KPI <kpi>{{kpiName}}</kpi> from its goal"
        values={values}
        components={components}
      />
    );
  },
  FeedItemContent: () => null,
  feedItemAlignment: () => "items-center",
  commentCount: () => 0,
  hasComments: () => false,
  NotificationTitle: () => "",
  NotificationLocation: () => null,
};

export default KpiGoalLinkChanged;
