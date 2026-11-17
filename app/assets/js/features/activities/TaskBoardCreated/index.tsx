import React from "react";
import type { ActivityContentTaskBoardCreated } from "@/api";
import i18n from "@/i18n";
import { Link } from "turboui";
import { Trans } from "../i18n";
import { activityAuthorName } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const TaskBoardCreated: ActivityHandler = {
  pageHtmlTitle: () => i18n.t("Created task board"),
  pagePath: (paths, activity) => {
    const data = activity.content as ActivityContentTaskBoardCreated;
    return data.space ? paths.spacePath(data.space.id) : paths.homePath();
  },
  PageTitle: () => <>{i18n.t("Created task board")}</>,
  PageContent: () => <></>,
  PageOptions: () => null,

  FeedItemTitle({ activity, page, paths }) {
    const data = activity.content as ActivityContentTaskBoardCreated;
    const sentence = page === "space" || !data.space
      ? i18n.t("{{author}} created the task board {{boardName}}.")
      : i18n.t("{{author}} created the task board {{boardName}} in the <space>{{spaceName}}</space> space.");

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
  NotificationTitle: () => i18n.t("Created task board"),
  NotificationLocation: () => null,
};

export default TaskBoardCreated;
