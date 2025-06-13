import * as People from "@/models/people";
import * as React from "react";

import { Activity, ActivityContentGoalClosing } from "@/api";
import { DeprecatedPaths } from "@/routes/paths";
import { Link } from "turboui";
import { ActivityHandler } from "../interfaces";

import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import { feedTitle, goalLink } from "../feedItemLinks";

import RichContent, { Summary } from "@/components/RichContent";

const GoalClosing: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    return `Goal reopened`;
  },

  pagePath(activity: Activity): string {
    return DeprecatedPaths.goalActivityPath(activity.id!);
  },

  PageTitle(_props: { activity: any }) {
    return <>Goal reopened</>;
  },

  PageContent({ activity }: { activity: Activity }) {
    return (
      <div>
        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <RichContent jsonContent={activity.commentThread!.message!} />
        )}
      </div>
    );
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemTitle({ activity, page }: { activity: Activity; content: any; page: any }) {
    const path = DeprecatedPaths.goalActivityPath(activity.id!);
    const link = <Link to={path}>reopened</Link>;

    if (page === "goal") {
      return feedTitle(activity, link, "the goal");
    } else {
      return feedTitle(activity, link, "the", goalLink(content(activity).goal!), "goal");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    return (
      <div>
        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <Summary jsonContent={activity.commentThread.message!} characterCount={300} />
        )}
      </div>
    );
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-center";
  },

  commentCount(activity: Activity): number {
    return activity.commentThread?.commentsCount || 0;
  },

  hasComments(activity: Activity): boolean {
    return !!activity.commentThread;
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    return People.firstName(activity.author!) + " reopened the " + content(activity).goal!.name! + " goal";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalClosing {
  return activity.content as ActivityContentGoalClosing;
}

export default GoalClosing;
