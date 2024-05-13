import React from "react";

import * as People from "@/models/people";
import * as Timeframes from "@/utils/timeframes";
import * as Icons from "@tabler/icons-react";

import { GoalLink } from "@/features/Feed/shared/GoalLink";
import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { Activity, ActivityContentGoalTimeframeEditing } from "@/gql";

import RichContent from "@/components/RichContent";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import { Commentable, Feedable, Pageable } from "./../interfaces";

const GoalTimeframeEditing: Commentable & Feedable & Pageable = {
  pageHtmlTitle(_activity: Activity) {
    return `Goal timeframe change`;
  },

  pagePath(activity: Activity) {
    const content = activity.content as ActivityContentGoalTimeframeEditing;
    return Paths.goalActivityPath(content.goal.id, activity.id);
  },

  PageTitle({ activity }) {
    return (
      <>
        Timeframe {extendedOrShortened(activity)} by {days(activity)} days
      </>
    );
  },

  PageContent({ activity }: { activity: Activity }) {
    const content = activity.content as ActivityContentGoalTimeframeEditing;

    const oldTimeframe = Timeframes.parse(content.oldTimeframe);
    const newTimeframe = Timeframes.parse(content.newTimeframe);

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
            <RichContent jsonContent={activity.commentThread.message} />
          </div>
        )}
      </div>
    );
  },

  FeedItemTitle({ activity, content, page }) {
    const path = Paths.goalActivityPath(content.goal.id, activity.id);

    return (
      <>
        {People.shortName(activity.author)} <Link to={path}>{extendedOrShortened(activity)} the timeframe</Link> for{" "}
        <GoalLink goal={content.goal} page={page} showOnGoalPage={true} />
      </>
    );
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const content = activity.content as ActivityContentGoalTimeframeEditing;

    const oldTimeframe = Timeframes.parse(content.oldTimeframe);
    const newTimeframe = Timeframes.parse(content.newTimeframe);

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
            <RichContent jsonContent={activity.commentThread.message} />
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
};

export default GoalTimeframeEditing;

function extendedOrShortened(activity: Activity) {
  const content = activity.content as ActivityContentGoalTimeframeEditing;

  const oldTimeframe = Timeframes.parse(content.oldTimeframe);
  const newTimeframe = Timeframes.parse(content.newTimeframe);

  if (Timeframes.compareDuration(oldTimeframe, newTimeframe) === 1) {
    return "extended";
  } else {
    return "shortened";
  }
}

function days(activity: Activity) {
  const content = activity.content as ActivityContentGoalTimeframeEditing;

  const oldTimeframe = Timeframes.parse(content.oldTimeframe);
  const newTimeframe = Timeframes.parse(content.newTimeframe);

  const diff = Timeframes.dayCount(newTimeframe) - Timeframes.dayCount(oldTimeframe);
  return Math.abs(diff);
}
