import React from "react";

import * as People from "@/models/people";

import { Activity, ActivityContentSpaceJoining } from "@/api";
import { ActivityHandler } from "../interfaces";
import { SpaceLink } from "../feedItemLinks";

const SpaceJoining: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(_activity: Activity): string {
    throw new Error("Not implemented");
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

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    return (
      <>
        {People.shortName(activity.author!)} joined <SpaceLink space={content(activity).space!} page={page} />
      </>
    );
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
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

  CommentNotificationTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },
};

export default SpaceJoining;

function content(activity: Activity): ActivityContentSpaceJoining {
  return activity.content as ActivityContentSpaceJoining;
}
