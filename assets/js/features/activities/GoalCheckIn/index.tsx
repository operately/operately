import React from "react";
import RichContent from "@/components/RichContent";

import { Paths } from "@/routes/paths";
import type { Activity, ActivityContentGoalCheckIn } from "@/models/activities";

import { ConditionChanges } from "./ConditionChanges";

import { Commentable, Feedable, Pageable, Notifiable } from "./../interfaces";

import * as People from "@/models/people";
import { GoalLink } from "@/features/Feed/shared/GoalLink";
import { Link } from "@/components/Link";

const GoalCheckIn: Commentable & Feedable & Pageable & Notifiable = {
  pagePath(activity: Activity): string {
    const content = activity.content as ActivityContentGoalCheckIn;
    return Paths.goalProgressUpdatePath(content.goal.id, content.update.id);
  },

  pageHtmlTitle(_activity: Activity): string {
    return "Progress Update";
  },

  PageTitle(_props: { activity: any }) {
    return <>Progress Update</>;
  },

  PageContent({ activity }: { activity: Activity }) {
    const content = activity.content as ActivityContentGoalCheckIn;

    return (
      <div className="flex flex-col">
        <RichContent jsonContent={content.update.message} />
        <ConditionChanges update={content.update} />
      </div>
    );
  },

  FeedItemContent({ content }: { activity: Activity; content: ActivityContentGoalCheckIn; page: string }) {
    return (
      <div className="flex flex-col">
        <RichContent jsonContent={content.update.message} />
        <ConditionChanges update={content.update} />
      </div>
    );
  },

  FeedItemTitle({ activity, page }) {
    const content = activity.content as ActivityContentGoalCheckIn;
    const path = Paths.goalProgressUpdatePath(content.goal.id, content.update.id);

    return (
      <>
        {People.shortName(activity.author)} <Link to={path}>updated the progress</Link> for{" "}
        <GoalLink goal={content.goal} page={page} showOnGoalPage={true} />
      </>
    );
  },

  commentCount(activity: Activity): number {
    const content = activity.content as ActivityContentGoalCheckIn;
    return content.update.commentsCount;
  },

  hasComments(_activity: Activity): boolean {
    return true;
  },

  NotificationTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },
};

export default GoalCheckIn;
