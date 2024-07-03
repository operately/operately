import * as People from "@/models/people";

import type { Activity } from "@/models/activities";
import type { ActivityContentDiscussionCommentSubmitted } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { Paths } from "@/routes/paths";

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

  FeedItemTitle(_props: { activity: Activity; page: any }) {
    throw new Error("Not implemented");
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    throw new Error("Not implemented");
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
