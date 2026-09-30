import * as React from "react";

import type { ActivityContentGoalCheckIn } from "@/api";
import type { Activity } from "@/models/activities";

import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { truncateString } from "@/utils/strings";
import { Link, SmallStatusIndicator, richContentToString } from "turboui";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { assertPresent } from "@/utils/assertions";
import { activityAuthorName, goalLink } from "../feedItemLinks";

const GoalCheckIn: ActivityHandler = {
  pagePath(paths, activity: Activity): string {
    return paths.goalCheckInPath(content(activity).update!.id!);
  },

  pageHtmlTitle(_activity: Activity): string {
    return i18n.t("Check In");
  },

  PageTitle(_props: { activity: any }) {
    return <Trans i18nKey="Check In" />;
  },

  PageContent(_data: { activity: Activity }) {
    return <></>;
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemContent({ activity }: { activity: Activity; page: string }) {
    const update = content(activity).update!;
    const fullMessage = richContentToString(JSON.parse(update.message!));
    const message = truncateString(fullMessage, 180);

    return (
      <div className="ProseMirror">
        <SmallStatusIndicator status={update.status!} />
        <span>{message}</span>
      </div>
    );
  },

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    const path = paths.goalCheckInPath(content(activity).update!.id!);
    const link = <Link to={path}>{null}</Link>;

    if (page === "goal") {
      return (
        <Trans
          i18nKey="{{author}} <checkIn>submitted a check-in</checkIn>"
          values={{ author: activityAuthorName(activity) }}
          components={{ checkIn: link }}
        />
      );
    } else {
      const goal = content(activity).goal;
      assertPresent(goal, "Goal is required for a check-in activity");
      return (
        <Trans
          i18nKey="{{author}} <checkIn>submitted a check-in</checkIn> for <goal>{{goalName}}</goal>"
          values={{ author: activityAuthorName(activity), goalName: goal.name }}
          components={{ checkIn: link, goal: goalLink(paths, goal) }}
        />
      );
    }
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-start";
  },

  commentCount(activity: Activity): number {
    return content(activity).update!.commentsCount!;
  },

  hasComments(_activity: Activity): boolean {
    return true;
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    return i18n.t("Submitted a check-in for {{goalName}}", { goalName: content(activity).goal?.name });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalCheckIn {
  return activity.content as ActivityContentGoalCheckIn;
}

export default GoalCheckIn;
