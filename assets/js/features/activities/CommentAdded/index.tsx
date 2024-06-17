import * as React from "react";

import type { ActivityHandler } from "../interfaces";
import type { Activity, ActivityContentCommentAdded, ActivityContentGoalTimeframeEditing } from "@/api";

import { match } from "ts-pattern";
import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { Summary } from "@/components/RichContent";
import { feedTitle, goalLink } from "../feedItemLinks";

const CommentAdded: ActivityHandler = {
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
    const commentedActivity = content(activity).activity!;

    return match(commentedActivity.action)
      .with("goal_timeframe_editing", () => {
        const c = commentedActivity.content as ActivityContentGoalTimeframeEditing;
        const goal = c.goal!;
        const path = Paths.goalActivityPath(goal.id!, commentedActivity.id!);
        const activityLink = <Link to={path}>goal timeframe editing</Link>;

        if (page === "goal") {
          return feedTitle(activity, "commented on the", activityLink);
        } else {
          return feedTitle(activity, "commented on the", activityLink, "in the", goalLink(goal), "goal");
        }
      })
      .with("goal_closing", () => {
        const c = commentedActivity.content as ActivityContentGoalTimeframeEditing;
        const goal = c.goal!;
        const path = Paths.goalActivityPath(goal.id!, commentedActivity.id!);
        const activityLink = <Link to={path}>goal closing</Link>;

        if (page === "goal") {
          return feedTitle(activity, "commented on the", activityLink);
        } else {
          return feedTitle(activity, "commented on the", activityLink, "in the", goalLink(goal), "goal");
        }
      })
      .with("goal_discussion_creation", () => {
        const c = commentedActivity.content as ActivityContentGoalTimeframeEditing;
        const goal = c.goal!;
        const path = Paths.goalActivityPath(goal.id!, commentedActivity.id!);
        const activityLink = <Link to={path}>{commentedActivity.commentThread!.title}</Link>;

        if (page === "goal") {
          return feedTitle(activity, "commented on the", activityLink);
        } else {
          return feedTitle(activity, "commented on the", activityLink, "in the", goalLink(goal), "goal");
        }
      })
      .otherwise(() => {
        throw new Error("Comment added not implemented for action: " + commentedActivity.action);
      });
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const comment = content(activity).comment!;
    const commentContent = JSON.parse(comment.content!)["message"];

    return <Summary jsonContent={commentContent} characterCount={200} />;
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

function content(activity: Activity): ActivityContentCommentAdded {
  return activity.content as ActivityContentCommentAdded;
}

export default CommentAdded;
