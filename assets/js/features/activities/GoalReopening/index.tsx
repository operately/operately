import * as React from "react";
import * as People from "@/models/people";

import { Activity, ActivityContentGoalClosing } from "@/api";
import { Paths } from "@/routes/paths";
import { ActivityHandler } from "../interfaces";
import { Link } from "@/components/Link";

import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import { goalLink, feedTitle } from "../feedItemLinks";

import RichContent, { Summary } from "@/components/RichContent";

const GoalClosing: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    return `Goal reopened`;
  },

  pagePath(activity: Activity): string {
    return Paths.goalActivityPath(content(activity).goal!.id!, activity.id!);
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
    const path = Paths.goalActivityPath(content(activity).goal!.id!, activity.id!);
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
          <Summary jsonContent={activity.commentThread.message} characterCount={300} />
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
