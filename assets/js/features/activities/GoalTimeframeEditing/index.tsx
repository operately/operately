import React from "react";

import * as People from "@/models/people";
import * as Timeframes from "@/utils/timeframes";
import * as Icons from "@tabler/icons-react";

import { GoalLink } from "./../feedItemLinks";
import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { Activity, ActivityContentGoalTimeframeEditing } from "@/api";

import RichContent from "@/components/RichContent";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import { ActivityHandler } from "../interfaces";

export const GoalTimeframeEditing: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    return `Goal timeframe change`;
  },

  pagePath(activity: Activity) {
    return Paths.goalActivityPath(content(activity).goal!.id!, activity.id!);
  },

  PageTitle({ activity }) {
    return (
      <>
        Timeframe {extendedOrShortened(activity)} by {days(activity)} days
      </>
    );
  },

  PageContent({ activity }: { activity: Activity }) {
    const oldTimeframe = Timeframes.parse(content(activity).oldTimeframe!);
    const newTimeframe = Timeframes.parse(content(activity).newTimeframe!);

    return (
      <div className="mt-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-medium">
            <div className="border border-stroke-base rounded-md px-2 py-0.5 bg-surface-dimmed font-medium text-sm">
              {Timeframes.format(oldTimeframe)}
            </div>
          </div>

          <Icons.IconArrowRight size={16} />

          <div className="flex items-center gap-1 font-medium">
            <div className="border border-stroke-base rounded-md px-2 py-0.5 bg-surface-dimmed font-medium text-sm">
              {Timeframes.format(newTimeframe)}
            </div>
          </div>
        </div>

        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <div className="mt-4">
            <RichContent jsonContent={activity.commentThread!.message!} />
          </div>
        )}
      </div>
    );
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemTitle({ activity, page }) {
    const path = Paths.goalActivityPath(content(activity).goal!.id!, activity.id!);

    return (
      <>
        {People.shortName(activity.author!)} <Link to={path}>{extendedOrShortened(activity)} the timeframe</Link> for{" "}
        <GoalLink goal={content(activity).goal!} page={page} showOnGoalPage={true} />
      </>
    );
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const oldTimeframe = Timeframes.parse(content(activity).oldTimeframe!);
    const newTimeframe = Timeframes.parse(content(activity).newTimeframe!);

    return (
      <div className="my-2">
        <div className="flex items-center gap-1 text-sm">
          <div className="flex items-center gap-1 font-medium">
            <div className="border border-stroke-base rounded-md px-2 bg-stone-400/20 font-medium text-sm">
              {Timeframes.format(oldTimeframe)}
            </div>
          </div>

          <Icons.IconArrowRight size={14} />

          <div className="flex items-center gap-1 font-medium">
            <div className="border border-stroke-base rounded-md px-2 bg-stone-400/20 font-medium text-sm">
              {Timeframes.format(newTimeframe)}
            </div>
          </div>
        </div>

        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <div className="mt-2">
            <RichContent jsonContent={activity.commentThread!.message!} />
          </div>
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
    return <>commented on the goal timeframe change</>;
  },
};

export default GoalTimeframeEditing;

function content(activity: Activity): ActivityContentGoalTimeframeEditing {
  return activity.content as ActivityContentGoalTimeframeEditing;
}

function extendedOrShortened(activity: Activity) {
  const oldTimeframe = Timeframes.parse(content(activity).oldTimeframe!);
  const newTimeframe = Timeframes.parse(content(activity).newTimeframe!);

  if (Timeframes.compareDuration(oldTimeframe, newTimeframe) === 1) {
    return "extended";
  } else {
    return "shortened";
  }
}

function days(activity: Activity) {
  const oldTimeframe = Timeframes.parse(content(activity).oldTimeframe!);
  const newTimeframe = Timeframes.parse(content(activity).newTimeframe!);

  const diff = Timeframes.dayCount(newTimeframe) - Timeframes.dayCount(oldTimeframe);
  return Math.abs(diff);
}
