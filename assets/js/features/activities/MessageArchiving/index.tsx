import type { Activity } from "@/models/activities";
import type { ActivityContentMessageArchiving } from "@/api";
import type { ActivityHandler } from "../interfaces";
import { Paths } from "@/routes/paths";
import React from "react";
import { Link } from "react-router-dom";
import { feedTitle } from "../feedItemLinks";

const MessageArchiving: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(_activity: Activity) {
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
    const title = content(activity).title!;
    const space = content(activity).space!;
    const spaceLink = <Link to={Paths.spacePath(space.id!)}>{space.name!}</Link>;

    if (page === "space") {
      return feedTitle(activity, "deleted:", title);
    } else {
      return feedTitle(activity, "deleted:", title, "from", spaceLink);
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
    return "";
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentMessageArchiving {
  return activity.content as ActivityContentMessageArchiving;
}

export default MessageArchiving;
