import * as React from "react";

import type {
  Activity,
  ActivityContentCommentAdded,
  ActivityContentGoalClosing,
  ActivityContentGoalDiscussionCreation,
  ActivityContentGoalReopening,
  ActivityContentGoalTimeframeEditing,
  ActivityContentProjectDiscussionSubmitted,
} from "@/api";
import type { ActivityHandler } from "../interfaces";

import { Summary } from "@/components/RichContent";
import { usePaths } from "@/routes/paths";
import { match } from "ts-pattern";
import { Link } from "turboui";
import { feedTitle, goalLink } from "../feedItemLinks";

const CommentAdded: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const commentedActivity = content(activity).activity!;

    return match(commentedActivity.action)
      .with("goal_timeframe_editing", () => paths.goalActivityPath(commentedActivity.id!))
      .with("goal_closing", () => paths.goalActivityPath(commentedActivity.id!))
      .with("goal_discussion_creation", () => paths.goalActivityPath(commentedActivity.id!))
      .with("goal_reopening", () => paths.goalActivityPath(commentedActivity.id!))
      .with("project_discussion_submitted", () => {
        const projectSubmitted = commentedActivity.content as ActivityContentProjectDiscussionSubmitted;
        return paths.projectDiscussionPath(projectSubmitted.discussion!.id!);
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
    const paths = usePaths();
    const commentedActivity = content(activity).activity!;

    return match(commentedActivity.action)
      .with("goal_timeframe_editing", () => {
        const c = commentedActivity.content as ActivityContentGoalTimeframeEditing;
        const goal = c.goal!;
        const path = paths.goalActivityPath(commentedActivity.id!);
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
        const path = paths.goalActivityPath(commentedActivity.id!);
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
        const path = paths.goalActivityPath(commentedActivity.id!);
        const activityLink = <Link to={path}>{commentedActivity.commentThread!.title}</Link>;

        if (page === "goal") {
          return feedTitle(activity, "commented on the", activityLink);
        } else {
          return feedTitle(activity, "commented on the", activityLink, "in the", goalLink(goal), "goal");
        }
      })
      .with("goal_reopening", () => {
        const c = commentedActivity.content as ActivityContentGoalReopening;
        const goal = c.goal!;
        const path = paths.goalActivityPath(commentedActivity.id!);
        const activityLink = <Link to={path}>goal reopening</Link>;

        if (page === "goal") {
          return feedTitle(activity, "commented on the", activityLink);
        } else {
          return feedTitle(activity, "commented on the", activityLink, "in the", goalLink(goal), "goal");
        }
      })
      .with("project_discussion_submitted", () => {
        const c = commentedActivity.content as ActivityContentProjectDiscussionSubmitted;
        const discussionTitle = commentedActivity.commentThread!.title;
        const path = paths.projectDiscussionPath(c.discussionId!);
        const activityLink = <Link to={path}>{discussionTitle}</Link>;

        if (page === "project") {
          return feedTitle(activity, "commented on the", activityLink);
        } else {
          return feedTitle(activity, "commented on the", activityLink, "in the project discussion");
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
    const commentedActivity = content(activity).activity!;
    const action = match(commentedActivity.action)
      .with("goal_timeframe_editing", () => "timeframe change")
      .with("goal_closing", () => "goal closing")
      .with("goal_discussion_creation", () => commentedActivity.commentThread!.title)
      .with("goal_reopening", () => "goal reopening")
      .with("project_discussion_submitted", () => commentedActivity.commentThread!.title)
      .otherwise(() => {
        throw new Error("Comment added not implemented for action: " + commentedActivity.action);
      });

    return "Re: " + action;
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
      .with("goal_reopening", () => {
        const c = commentedActivity.content as ActivityContentGoalReopening;
        return c.goal!.name!;
      })
      .with("project_discussion_submitted", () => {
        const c = commentedActivity.content as ActivityContentProjectDiscussionSubmitted;
        return c.title!;
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
