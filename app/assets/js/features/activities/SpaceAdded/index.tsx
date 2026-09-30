import { Activity, ActivityContentSpaceAdded } from "@/api";

import React from "react";
import { Trans } from "../i18n";
import { activityAuthorName, spaceLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const SpaceAdded: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    return paths.spacePath(content(activity).space!.id!);
  },

  PageTitle(_props: { activity: any }) {
    throw new Error("Not implemented");
  },

  PageContent(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    if (page === "space") {
      return <Trans i18nKey="{{author}} created this space" values={{ author: activityAuthorName(activity) }} />;
    } else {
      const space = content(activity).space;
      return (
        <Trans
          i18nKey="{{author}} created the <space>{{spaceName}}</space> space"
          values={{ author: activityAuthorName(activity), spaceName: space?.name }}
          components={{ space: space ? spaceLink(paths, space) : <span /> }}
        />
      );
    }
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-center";
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  NotificationLocation(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },
};

export default SpaceAdded;

function content(activity: Activity): ActivityContentSpaceAdded {
  return activity.content as ActivityContentSpaceAdded;
}
