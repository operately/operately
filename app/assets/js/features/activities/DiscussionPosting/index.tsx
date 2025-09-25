import * as People from "@/models/people";
import * as React from "react";

import type { ActivityContentDiscussionPosting } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { Summary } from "@/components/RichContent";

import { usePaths } from "@/routes/paths";
import { Link } from "turboui";
import { feedTitle, spaceLink } from "./../feedItemLinks";

const DiscussionPosting: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, _activity: Activity): string {
    return paths.discussionPath(content(_activity).discussion!.id!);
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
    const paths = usePaths();
    const discussion = content(activity).discussion!;

    const path = paths.discussionPath(discussion.id!);
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
    return "Posted: " + content(activity).discussion!.title!;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).space!.name!;
  },
};

function content(activity: Activity): ActivityContentDiscussionPosting {
  return activity.content as ActivityContentDiscussionPosting;
}

export default DiscussionPosting;
