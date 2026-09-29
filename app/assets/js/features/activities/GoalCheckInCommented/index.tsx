import * as React from "react";

import type { ActivityContentGoalCheckInCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { Summary } from "turboui";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, commentPath, commentedLink, goalCheckInLink, goalLink } from "./../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { parseCommentContent } from "@/models/comments";

const GoalUpdateCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { comment, goal, update } = content(activity);

    if (update?.id) {
      return commentPath(paths.goalCheckInPath(update.id), comment);
    } else {
      return paths.goalPath(goal.id);
    }
  },

  PageTitle(_props: { activity: any }) {
    throw new Error("Not implemented");
  },

  PageContent(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    const { comment, update, goal } = content(activity);
    const action = update?.id ? commentedLink(paths.goalCheckInPath(update.id), comment) : "commented";
    const checkInLink = goalCheckInLink(paths, update);
    const components = {
      action: typeof action === "string" ? <React.Fragment /> : action,
      checkIn: typeof checkInLink === "string" ? <React.Fragment /> : checkInLink,
      goal: goalLink(paths, goal),
    };
    const values = { author: activityAuthorName(activity), goalName: goal.name };

    if (page === "goal") {
      return (
        <Trans
          i18nKey="{{author}} <action>commented</action> on a <checkIn>Check-In</checkIn>"
          values={values}
          components={components}
        />
      );
    } else {
      return (
        <Trans
          i18nKey="{{author}} <action>commented</action> on a <checkIn>Check-In</checkIn> in the <goal>{{goalName}}</goal> goal"
          values={values}
          components={components}
        />
      );
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { mentionedPersonLookup } = useRichEditorHandlers();
    const { comment } = content(activity);
    const commentContent = parseCommentContent(comment?.content);

    if (!commentContent) {
      return null;
    }

    return <Summary content={commentContent} characterCount={200} mentionedPersonLookup={mentionedPersonLookup} />;
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-start";
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle(_activity: { activity: Activity }) {
    return i18n.t("Re: goal check-in");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalCheckInCommented {
  return activity.content as ActivityContentGoalCheckInCommented;
}

export default GoalUpdateCommented;
