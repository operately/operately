import React from "react";
import type { ActivityContentTaskBoardDefaultChanged } from "@/api";
import i18n from "@/i18n";
import { Link } from "turboui";
import { Trans } from "../i18n";
import { activityAuthorName } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const TaskBoardDefaultChanged: ActivityHandler = {
  pageHtmlTitle: () => i18n.t("Changed default task board"),
  pagePath: (paths, activity) => {
    const data = activity.content as ActivityContentTaskBoardDefaultChanged;
    return data.space ? paths.spacePath(data.space.id) : paths.homePath();
  },
  PageTitle: () => <>{i18n.t("Changed default task board")}</>,
  PageContent: () => <></>,
  PageOptions: () => null,

  FeedItemTitle({ activity, page, paths }) {
    const data = activity.content as ActivityContentTaskBoardDefaultChanged;
    const sentence =
      page === "space" || !data.space
        ? i18n.t("{{author}} made {{boardName}} the default task board.")
        : i18n.t("{{author}} made {{boardName}} the default task board in the <space>{{spaceName}}</space> space.");

    return (
      <Trans
        defaults={sentence}
        values={{ author: activityAuthorName(activity), boardName: data.name, spaceName: data.space?.name }}
        components={{ space: data.space ? <Link to={paths.spacePath(data.space.id)} /> : <React.Fragment /> }}
      />
    );
  },
  FeedItemContent: () => null,
  feedItemAlignment: () => "items-center",
  commentCount: () => 0,
  hasComments: () => false,
  NotificationTitle: () => i18n.t("Changed default task board"),
  NotificationLocation: () => null,
};

export default TaskBoardDefaultChanged;
