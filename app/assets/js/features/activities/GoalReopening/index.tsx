import * as React from "react";

import { Activity, ActivityContentGoalClosing } from "@/api";

import { usePaths } from "@/routes/paths";
import { isContentEmpty, Link, RichContent, Summary } from "turboui";
import { ActivityHandler } from "../interfaces";

import { feedTitle, goalLink } from "../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const GoalClosing: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    return `Goal reopened`;
  },

  pagePath(paths, activity: Activity): string {
    return paths.goalActivityPath(activity.id!);
  },

  PageTitle(_props: { activity: any }) {
    return <>Goal reopened</>;
  },

  PageContent({ activity }: { activity: Activity }) {
    const { mentionedPersonLookup } = useRichEditorHandlers();

    return (
      <div>
        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <RichContent
            content={activity.commentThread.message}
            mentionedPersonLookup={mentionedPersonLookup}
            parseContent
          />
        )}
      </div>
    );
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemTitle({ activity, page }: { activity: Activity; content: any; page: any }) {
    const paths = usePaths();
    const path = paths.goalActivityPath(activity.id!);
    const link = <Link to={path}>reopened</Link>;

    if (page === "goal") {
      return feedTitle(activity, link, "the goal");
    } else {
      return feedTitle(activity, link, "the", goalLink(content(activity).goal!), "goal");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { mentionedPersonLookup } = useRichEditorHandlers();

    return (
      <div>
        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <Summary
            content={activity.commentThread.message}
            characterCount={300}
            mentionedPersonLookup={mentionedPersonLookup}
          />
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
    return "Reopened the " + content(activity).goal!.name! + " goal";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalClosing {
  return activity.content as ActivityContentGoalClosing;
}

export default GoalClosing;
