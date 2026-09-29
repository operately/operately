import * as React from "react";

import { ActivityContentGoalClosing } from "@/api";
import { Activity } from "@/models/activities";

import { isContentEmpty, Link, RichContent, StatusBadge, Summary } from "turboui";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, goalLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const GoalClosing: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    return i18n.t("Goal closed");
  },

  pagePath(paths, activity: Activity): string {
    return paths.goalActivityPath(activity.id!);
  },

  PageTitle(_props: { activity: any }) {
    return <Trans i18nKey="Goal closed" />;
  },

  PageContent({ activity }: { activity: Activity }) {
    const data = content(activity);
    const { mentionedPersonLookup } = useRichEditorHandlers();

    return (
      <div>
        <div className="flex items-center gap-3">
          <StatusBadge status={data.successStatus} />
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

  FeedItemContent({ activity }: { activity: Activity }) {
    const data = content(activity);
    const { mentionedPersonLookup } = useRichEditorHandlers();

    return (
      <div>
        <div className="flex items-center gap-3 my-2">
          <StatusBadge status={data.successStatus} />
        </div>

        {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
          <div className="mt-2">
            <Summary
              content={activity.commentThread.message!}
              characterCount={300}
              mentionedPersonLookup={mentionedPersonLookup}
            />
          </div>
        )}
      </div>
    );
  },

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    const path = paths.goalActivityPath(activity.id!);
    const link = <Link to={path}>{null}</Link>;

    if (page === "goal") {
      return (
        <Trans
          i18nKey="{{author}} <action>closed</action> the goal"
          values={{ author: activityAuthorName(activity) }}
          components={{ action: link }}
        />
      );
    } else {
      const goal = content(activity).goal;
      return (
        <Trans
          i18nKey="{{author}} <action>closed</action> the <goal>{{goalName}}</goal> goal"
          values={{ author: activityAuthorName(activity), goalName: goal.name }}
          components={{ action: link, goal: goalLink(paths, goal) }}
        />
      );
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

  NotificationTitle(_: { activity: Activity }) {
    return i18n.t("Closed the goal");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

export default GoalClosing;

function content(activity: Activity): ActivityContentGoalClosing {
  return activity.content as ActivityContentGoalClosing;
}
