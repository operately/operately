import React from "react";
import RichContent from "@/components/RichContent";

import { Paths } from "@/routes/paths";
import type { Activity } from "@/models/activities";
import type { ActivityContentGoalCheckIn } from "@/api";

import { ConditionChanges } from "./ConditionChanges";
import { ActivityHandler } from "../interfaces";

import * as People from "@/models/people";
import { GoalLink } from "@/features/Feed/shared/GoalLink";
import { Link } from "@/components/Link";

const GoalCheckIn: ActivityHandler = {
  pagePath(activity: Activity): string {
    return Paths.goalProgressUpdatePath(content(activity).goal!.id!, content(activity).update!.id!);
  },

  pageHtmlTitle(_activity: Activity): string {
    return "Progress Update";
  },

  PageTitle(_props: { activity: any }) {
    return <>Progress Update</>;
  },

  PageContent({ activity }: { activity: Activity }) {
    return (
      <div className="flex flex-col">
        <RichContent jsonContent={content(activity).update!.message!} />
        <ConditionChanges update={content(activity).update!} />
      </div>
    );
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemContent({ activity }: { activity: Activity; page: string }) {
    return (
      <div className="flex flex-col">
        <RichContent jsonContent={content(activity).update!.message!} />
        <ConditionChanges update={content(activity).update!} />
      </div>
    );
  },

  FeedItemTitle({ activity, page }) {
    const path = Paths.goalProgressUpdatePath(content(activity).goal!.id!, content(activity).update!.id!);

    return (
      <>
        {People.shortName(activity.author!)} <Link to={path}>updated the progress</Link> for{" "}
        <GoalLink goal={content(activity).goal!} page={page} showOnGoalPage={true} />
      </>
    );
  },

  commentCount(activity: Activity): number {
    return content(activity).update!.commentsCount!;
  },

  hasComments(_activity: Activity): boolean {
    return true;
  },

  NotificationTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  CommentNotificationTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },
};

function content(activity: Activity): ActivityContentGoalCheckIn {
  return activity.content as ActivityContentGoalCheckIn;
}

export default GoalCheckIn;
