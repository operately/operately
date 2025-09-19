import * as People from "@/models/people";
import * as React from "react";

import { ActivityContentGoalClosing } from "@/api";
import RichContent, { Summary } from "@/components/RichContent";
import { Activity } from "@/models/activities";

import { usePaths } from "@/routes/paths";
import { isContentEmpty, Link, StatusBadge } from "turboui";
import { feedTitle, goalLink } from "../feedItemLinks";
import { ActivityHandler } from "../interfaces";

const GoalClosing: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    return `Goal closed`;
  },

  pagePath(paths, activity: Activity): string {
    return paths.goalActivityPath(activity.id!);
  },

  PageTitle(_props: { activity: any }) {
    return <>Goal closed</>;
  },

  PageContent({ activity }: { activity: Activity }) {
    const data = content(activity);

    return (
      <div>
        <div className="flex items-center gap-3">
          <StatusBadge status={data.successStatus} />
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

  FeedItemContent({ activity }: { activity: Activity }) {
    const data = content(activity);

    return (
      <div>
        <div className="flex items-center gap-3 my-2">
          <StatusBadge status={data.successStatus} />
        </div>

        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <div className="mt-2">
            <Summary jsonContent={activity.commentThread.message!} characterCount={300} />
          </div>
        )}
      </div>
    );
  },

  FeedItemTitle({ activity, page }: { activity: Activity; content: any; page: any }) {
    const paths = usePaths();
    const path = paths.goalActivityPath(activity.id!);
    const link = <Link to={path}>closed</Link>;

    if (page === "goal") {
      return feedTitle(activity, link, "the goal");
    } else {
      return feedTitle(activity, link, "the", goalLink(content(activity).goal!), "goal");
    }
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
    return "Closed the goal";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

export default GoalClosing;

function content(activity: Activity): ActivityContentGoalClosing {
  return activity.content as ActivityContentGoalClosing;
}
