import * as People from "@/models/people";

import type { Activity } from "@/models/activities";
import type { ActivityContentDiscussionCommentSubmitted } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { Paths } from "@/routes/paths";
import { Summary } from "@/components/RichContent";
import React from "react";
import { Link } from "@/components/Link";
import { feedTitle } from "../feedItemLinks";

const DiscussionCommentSubmitted: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(_activity: Activity): string {
    return Paths.discussionPath(content(_activity).discussion!.id!);
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
    const discussion = content(activity).discussion!;
    const space = content(activity).space!;

    const path = Paths.discussionPath(discussion.id!);
    const activityLink = <Link to={path}>{discussion.title}</Link>;

    if (page === "space") {
      return feedTitle(activity, "commented on", activityLink);
    } else {
      return feedTitle(activity, "commented on", activityLink, "in", space.name!, "space");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const comment = content(activity).comment!;
    const commentContent = JSON.parse(comment.content!)["message"];
    return <Summary jsonContent={commentContent} characterCount={200} />;
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
    return People.firstName(activity.author!) + " commented on: " + content(activity).discussion!.title!;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).space!.name!;
  },
};

function content(activity: Activity): ActivityContentDiscussionCommentSubmitted {
  return activity.content as ActivityContentDiscussionCommentSubmitted;
}

export default DiscussionCommentSubmitted;
