import * as React from "react";

import type { Activity } from "@/models/activities";
import type { ActivityContentDiscussionPosting } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { Summary } from "@/components/RichContent";
import { feedTitle, spaceLink } from "./../feedItemLinks";

const DiscussionPosting: ActivityHandler = {
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
    const space = content(activity).space!;
    const discussion = content(activity).discussion!;

    const path = Paths.discussionPath(space.id!, discussion.id!);
    const link = <Link to={path}>{discussion.title!}</Link>;

    if (page === "space") {
      return feedTitle(activity, "posted", link);
    } else {
      return feedTitle(activity, "posted", link, "in the", spaceLink(content(activity).space!));
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    return <Summary jsonContent={content(activity).discussion!.body!} characterCount={200} />;
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

function content(activity: Activity): ActivityContentDiscussionPosting {
  return activity.content as ActivityContentDiscussionPosting;
}

export default DiscussionPosting;
