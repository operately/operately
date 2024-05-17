import React from "react";

import * as People from "@/models/people";

import { Activity, ActivityContentGoalDiscussionCreation } from "@/models/activities";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import RichContent, { Summary } from "@/components/RichContent";
import { Paths } from "@/routes/paths";

import { Commentable, Feedable, Pageable, Notifiable } from "./../interfaces";
import { GoalLink } from "@/features/Feed/shared/GoalLink";
import { Link } from "@/components/Link";

const GoalDiscussionCreation: Commentable & Feedable & Pageable & Notifiable = {
  pageHtmlTitle(activity: Activity) {
    return activity.commentThread!.title as string;
  },

  pagePath(activity: Activity): string {
    const content = activity.content as ActivityContentGoalDiscussionCreation;
    return Paths.goalActivityPath(content.goal.id, activity.id);
  },

  PageTitle({ activity }: { activity: Activity }) {
    return <>{activity.commentThread!.title}</>;
  },

  PageContent({ activity }: { activity: Activity }) {
    return (
      <div>
        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <RichContent jsonContent={activity.commentThread.message} />
        )}
      </div>
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

  FeedItemTitle({ activity, content, page }: { activity: Activity; content: any; page: any }) {
    const path = Paths.goalActivityPath(content.goal.id, activity.id);
    const link = <Link to={path}>{activity.commentThread!.title}</Link>;

    return (
      <>
        {People.shortName(activity.author)} posted {link}
        <GoalLink goal={content.goal} page={page} showOnGoalPage={false} prefix=" on" />
      </>
    );
  },

  commentCount(activity: Activity): number {
    return activity.commentThread?.commentsCount || 0;
  },

  hasComments(activity: Activity): boolean {
    return !!activity.commentThread;
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    const author = activity.author;
    const title = activity.commentThread!.title;

    return (
      <>
        {People.firstName(author)} posted: {title}
      </>
    );
  },

  CommentNotificationTitle({ activity }: { activity: Activity }) {
    return <>commented on {activity.commentThread!.title}</>;
  },
};

export default GoalDiscussionCreation;
