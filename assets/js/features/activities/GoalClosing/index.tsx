import React from "react";

import * as Icons from "@tabler/icons-react";
import * as People from "@/models/people";

import { Activity, ActivityContentGoalClosing } from "@/models/activities";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import RichContent, { Summary } from "@/components/RichContent";
import { Paths } from "@/routes/paths";

import { Commentable, Feedable, Pageable, Notifiable } from "./../interfaces";
import { GoalLink } from "@/features/Feed/shared/GoalLink";
import { Link } from "@/components/Link";

const GoalClosing: Commentable & Feedable & Pageable & Notifiable = {
  pageHtmlTitle(_activity: Activity) {
    return `Goal closed`;
  },

  pagePath(activity: Activity): string {
    const content = activity.content as ActivityContentGoalClosing;
    return Paths.goalActivityPath(content.goal.id, activity.id);
  },

  PageTitle(_props: { activity: any }) {
    return <>Goal closed</>;
  },

  PageContent({ activity }: { activity: Activity }) {
    const content = activity.content as ActivityContentGoalClosing;

    return (
      <div>
        <div className="flex items-center gap-3">
          {content.success === "yes" ? <AcomplishedBadge /> : <FailedBadge />}
        </div>

        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <div className="mt-4">
            <RichContent jsonContent={activity.commentThread.message} />
          </div>
        )}
      </div>
    );
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const content = activity.content as ActivityContentGoalClosing;

    return (
      <div>
        <div className="flex items-center gap-3 my-2">
          {content.success === "yes" ? <AcomplishedBadge /> : <FailedBadge />}
        </div>

        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <div className="mt-2">
            <Summary jsonContent={activity.commentThread.message} characterCount={300} />
          </div>
        )}
      </div>
    );
  },

  FeedItemTitle({ activity, content, page }: { activity: Activity; content: any; page: any }) {
    const path = Paths.goalActivityPath(content.goal.id, activity.id);
    const link = <Link to={path}>closed</Link>;

    return (
      <>
        {People.shortName(activity.author)} {link} <GoalLink goal={content.goal} page={page} showOnGoalPage={true} />
      </>
    );
  },

  commentCount(activity: Activity): number {
    return activity.commentThread?.commentsCount || 0;
  },

  hasComments(activity: Activity): boolean {
    return !!activity.commentThread;
  },

  NotificationTitle(_props: { activity: Activity }) {
    return <>Goal closed</>;
  },

  CommentNotificationTitle(_props: { activity: Activity }) {
    return <>commented on the goal closing</>;
  },
};

export default GoalClosing;

function AcomplishedBadge() {
  return (
    <div className="flex items-center gap-1 bg-green-500/20 rounded-xl py-0.5 px-2 pr-3 text-green-800">
      <Icons.IconCheck size={16} />
      <div className="text-sm font-medium">Marked as accomplished</div>
    </div>
  );
}

function FailedBadge() {
  return (
    <div className="flex items-center gap-1 bg-red-500/20 rounded-xl py-0.5 px-2 pr-3 text-red-800">
      <Icons.IconX size={16} />
      <div className="text-sm font-medium">Marked as not accomplished</div>
    </div>
  );
}
