import * as React from "react";
import * as People from "@/models/people";
import RichContent from "@/components/RichContent";

import { Paths } from "@/routes/paths";
import type { Activity } from "@/models/activities";
import type { ActivityContentGoalCheckIn } from "@/api";

import { ConditionChanges } from "./ConditionChanges";
import { ActivityHandler } from "../interfaces";

import { Link } from "@/components/Link";
import { feedTitle, goalLink } from "../feedItemLinks";
import { SmallStatusIndicator } from "@/components/status";
import { TimeframeEdited } from "../GoalTimeframeEditing/TimeframeEdited";

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
    const update = content(activity).update!;
    const newTimeframe = content(activity).newTimeframe;
    const oldTimeframe = content(activity).oldTimeframe;

    return (
      <div className="flex flex-col">
        <RichContent jsonContent={update.message!} />
        <ConditionChanges update={update} />
        <SmallStatusIndicator status={update.status!} />
        {newTimeframe && oldTimeframe && <TimeframeEdited newTimeframe={newTimeframe} oldTimeframe={oldTimeframe} />}
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
