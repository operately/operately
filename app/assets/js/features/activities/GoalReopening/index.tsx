import * as React from "react";

import { Activity, ActivityContentGoalClosing } from "@/api";

import { isContentEmpty, Link, RichContent, Summary } from "turboui";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, goalLink } from "../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const GoalClosing: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    return i18n.t("Goal reopened");
  },

  pagePath(paths, activity: Activity): string {
    return paths.goalActivityPath(activity.id!);
  },

  PageTitle(_props: { activity: any }) {
    return <Trans i18nKey="Goal reopened" />;
  },

  PageContent({ activity }: { activity: Activity }) {
    const { mentionedPersonLookup } = useRichEditorHandlers();

    return (
      <div>
        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <RichContent
            taskList={{ canEdit: false }}
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

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    const path = paths.goalActivityPath(activity.id!);
    const link = <Link to={path}>{null}</Link>;

    if (page === "goal") {
      return (
        <Trans
          i18nKey="{{author}} <action>reopened</action> the goal"
          values={{ author: activityAuthorName(activity) }}
          components={{ action: link }}
        />
      );
    } else {
      const goal = content(activity).goal;
      return (
        <Trans
          i18nKey="{{author}} <action>reopened</action> the <goal>{{goalName}}</goal> goal"
          values={{ author: activityAuthorName(activity), goalName: goal.name }}
          components={{ action: link, goal: goalLink(paths, goal) }}
        />
      );
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
    return i18n.t("Reopened the {{goalName}} goal", { goalName: content(activity).goal.name });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalClosing {
  return activity.content as ActivityContentGoalClosing;
}

export default GoalClosing;
