import * as React from "react";
import * as People from "@/models/people";

import { Paths } from "@/routes/paths";
import type { Activity } from "@/models/activities";
import type { ActivityContentGoalCheckIn } from "@/api";

import { ActivityHandler } from "../interfaces";

import { Link } from "@/components/Link";
import { feedTitle, goalLink } from "../feedItemLinks";
import { richContentToString } from "@/components/RichContent";
import { truncateString } from "@/utils/strings";
import { match } from "ts-pattern";

const GoalCheckIn: ActivityHandler = {
  pagePath(activity: Activity): string {
    return Paths.goalProgressUpdatePath(content(activity).update!.id!);
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

    const status = match(update.status)
      .with("pending", () => <span>Pending</span>)
      .with("on_track", () => <span>On Track</span>)
      .with("concern", () => <span>Needs Attention</span>)
      .with("caution", () => <span>Needs Attention</span>)
      .with("issue", () => <span>At Risk</span>)
      .run();

    return (
      <div className="ProseMirror">
        {status} &mdash; <span>{message}</span>
      </div>
    );
  },

  FeedItemTitle({ activity, page }) {
    const path = Paths.goalProgressUpdatePath(content(activity).update!.id!);
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
