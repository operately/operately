import * as React from "react";
import * as People from "@/models/people";

import type { ActivityHandler } from "../interfaces";
import type {
  Activity,
  ActivityContentCommentAdded,
  ActivityContentGoalClosing,
  ActivityContentGoalDiscussionCreation,
  ActivityContentGoalTimeframeEditing,
} from "@/api";

import { match } from "ts-pattern";
import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { Summary } from "@/components/RichContent";
import { feedTitle, goalLink } from "../feedItemLinks";

const CommentAdded: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity): string {
    const commentedActivity = content(activity).activity!;

    return match(commentedActivity.action)
      .with("goal_timeframe_editing", () => {
        const content = commentedActivity.content as ActivityContentGoalTimeframeEditing;
        return Paths.goalActivityPath(content.goal!.id!, commentedActivity.id!);
      })
      .with("goal_closing", () => {
        const content = commentedActivity.content as ActivityContentGoalClosing;
        return Paths.goalActivityPath(content.goal!.id!, commentedActivity.id!);
      })
      .with("goal_discussion_creation", () => {
        const content = commentedActivity.content as ActivityContentGoalDiscussionCreation;
        return Paths.goalActivityPath(content.goal!.id!, commentedActivity.id!);
      })
      .otherwise(() => {
        throw new Error("Comment added not implemented for action: " + commentedActivity.action);
      });
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
        const activityLink = <Link to={path}>timeframe change</Link>;

        if (page === "goal") {
          return feedTitle(activity, "commented on the", activityLink);
        } else {
          return feedTitle(activity, "commented on the", activityLink, "in the", goalLink(goal), "goal");
        }
      })
      .with("goal_closing", () => {
        const c = commentedActivity.content as ActivityContentGoalClosing;
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
        const c = commentedActivity.content as ActivityContentGoalDiscussionCreation;
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

  NotificationTitle({ activity }: { activity: Activity }) {
    const commentedActivity = content(activity).activity!;
    const person = People.firstName(activity.author!);

    return (
      person +
      " commented on the " +
      match(commentedActivity.action)
        .with("goal_timeframe_editing", () => "timeframe change")
        .with("goal_closing", () => "goal closing")
        .with("goal_discussion_creation", () => commentedActivity.commentThread!.title)
        .otherwise(() => {
          throw new Error("Comment added not implemented for action: " + commentedActivity.action);
        })
    );
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    const commentedActivity = content(activity).activity!;

    return match(commentedActivity.action)
      .with("goal_timeframe_editing", () => {
        const c = commentedActivity.content as ActivityContentGoalTimeframeEditing;
        return c.goal!.name!;
      })
      .with("goal_closing", () => {
        const c = commentedActivity.content as ActivityContentGoalClosing;
        return c.goal!.name!;
      })
      .with("goal_discussion_creation", () => {
        const c = commentedActivity.content as ActivityContentGoalDiscussionCreation;
        return c.goal!.name!;
      })
      .otherwise(() => {
        throw new Error("Comment added not implemented for action: " + commentedActivity.action);
      });
  },
};

function content(activity: Activity): ActivityContentCommentAdded {
  return activity.content as ActivityContentCommentAdded;
}

export default CommentAdded;
