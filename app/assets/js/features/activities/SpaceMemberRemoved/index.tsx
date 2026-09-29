import { Activity, ActivityContentSpaceMemberRemoved } from "@/api";
import { shortName } from "@/models/people";

import React from "react";
import { Trans } from "../i18n";
import { activityAuthorName, spaceLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

const SpaceMemberRemoved: ActivityHandler = {
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
    const person = shortName(content(activity).member!);
    const space = spaceLink(paths, content(activity).space!);

    if (page === "space") {
      return (
        <Trans
          i18nKey="{{author}} removed {{personName}} from the space"
          values={{ author: activityAuthorName(activity), personName: person }}
        />
      );
    } else {
      return (
        <Trans
          i18nKey="{{author}} removed {{personName}} from the <space>{{spaceName}}</space> space"
          values={{
            author: activityAuthorName(activity),
            personName: person,
            spaceName: content(activity).space?.name,
          }}
          components={{ space }}
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

export default SpaceMemberRemoved;

function content(activity: Activity): ActivityContentSpaceMemberRemoved {
  return activity.content as ActivityContentSpaceMemberRemoved;
}
