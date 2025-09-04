import * as People from "@/models/people";
import * as React from "react";

import type { ActivityContentGoalCheckIn } from "@/api";
import type { Activity } from "@/models/activities";

import { ActivityHandler } from "../interfaces";

import { usePaths } from "@/routes/paths";
import { truncateString } from "@/utils/strings";
import { Link, richContentToString } from "turboui";
import { feedTitle, goalLink } from "../feedItemLinks";
import { SmallStatusIndicator } from "@/components/status";

const GoalCheckIn: ActivityHandler = {
  pagePath(paths, activity: Activity): string {
    return paths.goalCheckInPath(content(activity).update!.id!);
  },

  pageHtmlTitle(_activity: Activity): string {
    return "Check In";
  },

  PageTitle(_props: { activity: any }) {
    return <>Check In</>;
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

  FeedItemTitle({ activity, page }) {
    const paths = usePaths();
    const path = paths.goalCheckInPath(content(activity).update!.id!);
    const link = <Link to={path}>submitted a check-in</Link>;

    if (page === "goal") {
      return feedTitle(activity, link);
    } else {
      return feedTitle(activity, link, "for", goalLink(content(activity).goal!));
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
    return People.firstName(activity.author!) + " submitted a check-in for " + content(activity).goal!.name!;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalCheckIn {
  return activity.content as ActivityContentGoalCheckIn;
}

export default GoalCheckIn;
