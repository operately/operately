import * as React from "react";

import * as Timeframes from "@/utils/timeframes";
import { IconArrowRight, isContentEmpty } from "turboui";

import { Activity, ActivityContentGoalTimeframeEditing } from "@/api";

import { Link } from "turboui";
import { feedTitle, goalLink } from "../feedItemLinks";

import RichContent from "@/components/RichContent";
import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { ActivityHandler } from "../interfaces";
import { TimeframeEdited } from "./TimeframeEdited";

const GoalTimeframeEditing: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    return `Goal timeframe change`;
  },

  pagePath(paths, activity: Activity) {
    return paths.goalActivityPath(activity.id!);
  },

  PageTitle({ activity }) {
    return (
      <>
        Timeframe {extendedOrShortened(activity)} by {days(activity)} days
      </>
    );
  },

  PageContent({ activity }: { activity: Activity }) {
    const oldTimeframe = content(activity).oldTimeframe!;
    const newTimeframe = content(activity).newTimeframe!;

    return (
      <div className="mt-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-medium">
            <div className="border border-stroke-base rounded-md px-2 py-0.5 bg-surface-dimmed font-medium text-sm">
              {Timeframes.getTimeframeRange(oldTimeframe)}
            </div>
          </div>

          <IconArrowRight size={16} />

          <div className="flex items-center gap-1 font-medium">
            <div className="border border-stroke-base rounded-md px-2 py-0.5 bg-surface-dimmed font-medium text-sm">
              {Timeframes.getTimeframeRange(newTimeframe)}
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
    const paths = usePaths();
    const path = paths.goalActivityPath(activity.id!);
    const activityLink = <Link to={path}>{extendedOrShortened(activity)} the timeframe</Link>;

    if (page === "goal") {
      return feedTitle(activity, activityLink);
    } else {
      return feedTitle(activity, activityLink, " on the", goalLink(content(activity).goal!));
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const data = content(activity);

    assertPresent(data.newTimeframe, "newTimeframe must be present in activity");
    assertPresent(data.oldTimeframe, "oldTimeframe must be present in activity");

    return (
      <div>
        <TimeframeEdited newTimeframe={data.newTimeframe} oldTimeframe={data.oldTimeframe} />

        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <div className="my-2">
            <RichContent jsonContent={activity.commentThread!.message!} />
          </div>
        )}
      </div>
    );
  },

  feedItemAlignment(_activity: Activity) {
    return "items-start";
  },

  commentCount(activity: Activity): number {
    return activity.commentThread?.commentsCount || 0;
  },

  hasComments(activity: Activity): boolean {
    return !!activity.commentThread;
  },

  NotificationTitle(_props: { activity: Activity }) {
    return "Edited the goal's timeframe";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

export default GoalTimeframeEditing;

function content(activity: Activity): ActivityContentGoalTimeframeEditing {
  return activity.content as ActivityContentGoalTimeframeEditing;
}

function extendedOrShortened(activity: Activity) {
  const oldTimeframe = content(activity).oldTimeframe!;
  const newTimeframe = content(activity).newTimeframe!;

  if (Timeframes.compareDuration(oldTimeframe, newTimeframe) === 1) {
    return "extended";
  } else {
    return "shortened";
  }
}

function days(activity: Activity) {
  const oldTimeframe = content(activity).oldTimeframe!;
  const newTimeframe = content(activity).newTimeframe!;

  const diff = Timeframes.dayCount(newTimeframe) - Timeframes.dayCount(oldTimeframe);
  return Math.abs(diff);
}
