import * as React from "react";
import * as People from "@/models/people";

import type { ActivityHandler } from "../interfaces";
import type { Activity, ActivityContentCommentAdded, ActivityContentGoalTimeframeEditing } from "@/api";

import { match } from "ts-pattern";
import { GoalLink } from "./../feedItemLinks";
import { Paths } from "@/routes/paths";
import { Link } from "react-router-dom";
import { Summary } from "@/components/RichContent";

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

        return (
          <>
            {People.shortName(activity.author!)} commented on the <Link to={path}>timeframe edit</Link>{" "}
            <GoalLink goal={goal} page={page} prefix={"for"} />
          </>
        );
      })
      .with("goal_closing", () => {
        const c = commentedActivity.content as ActivityContentGoalTimeframeEditing;
        const goal = c.goal!;
        const path = Paths.goalActivityPath(goal.id!, commentedActivity.id!);

        return (
          <>
            {People.shortName(activity.author!)} commented on the <Link to={path}>goal closing</Link>{" "}
            <GoalLink goal={goal} page={page} />
          </>
        );
      })
      .with("goal_discussion_creation", () => {
        const c = commentedActivity.content as ActivityContentGoalTimeframeEditing;
        const goal = c.goal!;
        const path = Paths.goalActivityPath(goal.id!, commentedActivity.id!);

        return (
          <>
            {People.shortName(activity.author!)} commented on the <Link to={path}>discussion creation</Link>{" "}
            <GoalLink goal={goal} page={page} />
          </>
        );
      })
      .otherwise(() => {
        throw new Error("Not implemented");
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
