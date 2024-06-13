import React from "react";

import * as People from "@/models/people";

import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { Activity, ActivityContentSpaceJoining } from "@/api";
import { ActivityHandler } from "../interfaces";

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

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
  },

  FeedItemTitle({ activity, page }: { activity: Activity; content: any; page: any }) {
    const spacePath = Paths.spacePath(content(activity).space!.id!);

    if (page === "space") {
      return <>{People.shortName(activity.author!)} joined this space</>;
    }

    if (page === "company" || "profile") {
      return (
        <>
          {People.shortName(activity.author!)} joined the <Link to={spacePath}>{content(activity).space!.name!}</Link>{" "}
          space
        </>
      );
    }

    throw new Error("Unsupported page type: " + page);
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
