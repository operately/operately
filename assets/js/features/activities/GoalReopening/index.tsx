import React from "react";

import * as People from "@/models/people";

import { Activity, ActivityContentGoalClosing } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { Commentable, Feedable, Pageable } from "./../interfaces";
import { GoalLink } from "@/features/Feed/shared/GoalLink";
import { Link } from "@/components/Link";

import { isContentEmpty } from "@/components/RichContent/isContentEmpty";

import RichContent, { Summary } from "@/components/RichContent";

const GoalClosing: Commentable & Feedable & Pageable = {
  pageHtmlTitle(_activity: Activity) {
    return `Goal reopened`;
  },

  pagePath(activity: Activity): string {
    const content = activity.content as ActivityContentGoalClosing;
    return Paths.goalActivityPath(content.goal.id, activity.id);
  },

  PageTitle(_props: { activity: any }) {
    return <>Goal reopened</>;
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
    const link = <Link to={path}>reopened</Link>;

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
};

export default GoalClosing;
