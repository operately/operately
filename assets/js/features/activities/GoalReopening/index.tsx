import React from "react";

import * as People from "@/models/people";

import { Activity, ActivityContentGoalClosing } from "@/api";
import { Paths } from "@/routes/paths";
import { ActivityHandler } from "../interfaces";
import { GoalLink } from "./../feedItemLinks";
import { Link } from "@/components/Link";

import { isContentEmpty } from "@/components/RichContent/isContentEmpty";

import RichContent, { Summary } from "@/components/RichContent";

const GoalClosing: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    return `Goal reopened`;
  },

  pagePath(activity: Activity): string {
    return Paths.goalActivityPath(content(activity).goal!.id!, activity.id!);
  },

  PageTitle(_props: { activity: any }) {
    return <>Goal reopened</>;
  },

  PageContent({ activity }: { activity: Activity }) {
    return (
      <div>
        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <RichContent jsonContent={activity.commentThread!.message!} />
        )}
      </div>
    );
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemTitle({ activity, page }: { activity: Activity; content: any; page: any }) {
    const path = Paths.goalActivityPath(content(activity).goal!.id!, activity.id!);
    const link = <Link to={path}>reopened</Link>;

    return (
      <>
        {People.shortName(activity.author!)} {link}{" "}
        <GoalLink goal={content(activity).goal!} page={page} showOnGoalPage={true} />
      </>
    );
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    return (
      <div>
        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <Summary jsonContent={activity.commentThread.message} characterCount={300} />
        )}
      </div>
    );
  },

  commentCount(activity: Activity): number {
    return activity.commentThread?.commentsCount || 0;
  },

  hasComments(activity: Activity): boolean {
    return !!activity.commentThread;
  },

  NotificationTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  CommentNotificationTitle(_props: { activity: Activity }) {
    return <>commented on the goal reopening</>;
  },
};

function content(activity: Activity): ActivityContentGoalClosing {
  return activity.content as ActivityContentGoalClosing;
}

export default GoalClosing;
