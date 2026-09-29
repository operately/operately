import * as React from "react";

import * as Timeframes from "@/utils/timeframes";
import { IconArrowRight, isContentEmpty, RichContent } from "turboui";

import { Activity, ActivityContentGoalTimeframeEditing } from "@/api";

import { Link } from "turboui";
import { Trans } from "../i18n";
import i18n, { tn } from "@/i18n";
import { activityAuthorName, goalLink } from "../feedItemLinks";

import { assertPresent } from "@/utils/assertions";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { TimeframeEdited } from "./TimeframeEdited";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const GoalTimeframeEditing: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    return i18n.t("Goal timeframe change");
  },

  pagePath(paths, activity: Activity) {
    return paths.goalActivityPath(activity.id!);
  },

  PageTitle({ activity }) {
    // Preserve the existing English "days" wording even for a one-day change.
    const title = isExtended(activity)
      ? tn("Timeframe extended by {{count}} days", "Timeframe extended by {{count}} days", days(activity))
      : tn("Timeframe shortened by {{count}} days", "Timeframe shortened by {{count}} days", days(activity));
    return <>{title}</>;
  },

  PageContent({ activity }: { activity: Activity }) {
    const { newTimeframe, oldTimeframe } = content(activity);
    const { mentionedPersonLookup } = useRichEditorHandlers();

    return (
      <div className="mt-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-medium">
            <div className="border border-stroke-base rounded-md px-2 py-0.5 bg-surface-dimmed font-medium text-sm">
              {oldTimeframe && Timeframes.getTimeframeRange(oldTimeframe)}
            </div>
          </div>

          <IconArrowRight size={16} />

          <div className="flex items-center gap-1 font-medium">
            <div className="border border-stroke-base rounded-md px-2 py-0.5 bg-surface-dimmed font-medium text-sm">
              {newTimeframe && Timeframes.getTimeframeRange(newTimeframe)}
            </div>
          </div>
        </div>

        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <div className="mt-4">
            <RichContent
              taskList={{ canEdit: false }}
              content={activity.commentThread.message}
              mentionedPersonLookup={mentionedPersonLookup}
              parseContent
            />
          </div>
        )}
      </div>
    );
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    const path = paths.goalActivityPath(activity.id!);
    const goal = content(activity).goal;
    assertPresent(goal, "Goal is required for a timeframe activity");
    const sentence =
      page === "goal"
        ? isExtended(activity)
          ? i18n.t("{{author}} <action>extended the timeframe</action>")
          : i18n.t("{{author}} <action>shortened the timeframe</action>")
        : isExtended(activity)
          ? i18n.t("{{author}} <action>extended the timeframe</action> on the <goal>{{goalName}}</goal>")
          : i18n.t("{{author}} <action>shortened the timeframe</action> on the <goal>{{goalName}}</goal>");
    return (
      <Trans
        defaults={sentence}
        values={{ author: activityAuthorName(activity), goalName: goal.name }}
        components={{ action: <Link to={path}>{null}</Link>, goal: goalLink(paths, goal) }}
      />
    );
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const data = content(activity);
    const { mentionedPersonLookup } = useRichEditorHandlers();

    assertPresent(data.newTimeframe, "newTimeframe must be present in activity");
    assertPresent(data.oldTimeframe, "oldTimeframe must be present in activity");

    return (
      <div>
        <TimeframeEdited newTimeframe={data.newTimeframe} oldTimeframe={data.oldTimeframe} />

        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <div className="my-2">
            <RichContent
              taskList={{ canEdit: false }}
              content={activity.commentThread.message}
              mentionedPersonLookup={mentionedPersonLookup}
              parseContent
            />
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
    return i18n.t("Edited the goal's timeframe");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

export default GoalTimeframeEditing;

function content(activity: Activity): ActivityContentGoalTimeframeEditing {
  return activity.content as ActivityContentGoalTimeframeEditing;
}

function isExtended(activity: Activity) {
  const oldTimeframe = content(activity).oldTimeframe!;
  const newTimeframe = content(activity).newTimeframe!;

  return Timeframes.compareDuration(oldTimeframe, newTimeframe) === 1;
}

function days(activity: Activity) {
  const oldTimeframe = content(activity).oldTimeframe!;
  const newTimeframe = content(activity).newTimeframe!;

  const diff = Timeframes.dayCount(newTimeframe) - Timeframes.dayCount(oldTimeframe);
  return Math.abs(diff);
}
