import React from "react";
import type { ActivityContentTaskBoardRenamed } from "@/api";
import i18n from "@/i18n";
import { Link } from "turboui";
import { Trans } from "../i18n";
import { activityAuthorName } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const TaskBoardRenamed: ActivityHandler = {
  pageHtmlTitle: () => i18n.t("Renamed task board"),
  pagePath: (paths, activity) => {
    const data = activity.content as ActivityContentTaskBoardRenamed;
    return data.space ? paths.spacePath(data.space.id) : paths.homePath();
  },
  PageTitle: () => <>{i18n.t("Renamed task board")}</>,
  PageContent: () => <></>,
  PageOptions: () => null,

  FeedItemTitle({ activity, page, paths }) {
    const data = activity.content as ActivityContentTaskBoardRenamed;
    const sentence = page === "space" || !data.space
      ? i18n.t("{{author}} renamed the task board {{boardName}}.")
      : i18n.t("{{author}} renamed the task board {{boardName}} in the <space>{{spaceName}}</space> space.");

    return (
      <Trans
        defaults={sentence}
        values={{ author: activityAuthorName(activity), boardName: data.newName, spaceName: data.space?.name }}
        components={{ space: data.space ? <Link to={paths.spacePath(data.space.id)} /> : <React.Fragment /> }}
      />
    );
  },
  FeedItemContent: () => null,
  feedItemAlignment: () => "items-center",
  commentCount: () => 0,
  hasComments: () => false,
  NotificationTitle: () => i18n.t("Renamed task board"),
  NotificationLocation: () => null,
};

export default TaskBoardRenamed;
