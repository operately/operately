import React from "react";
import type { ActivityContentGoalDescriptionChanged } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { feedTitle, goalLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { Summary } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const GoalDescriptionChanged: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity) {
    const { goal } = content(activity);

    if (goal) {
      return paths.goalPath(goal.id);
    } else {
      return paths.homePath();
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

  FeedItemTitle({ activity, page }: { activity: Activity; page: string }) {
    const data = content(activity);
    const title = data.goal ? goalLink(data.goal) : `"${data.goalName}"`;

    const message = data.hasDescription
      ? ["updated goal", title, "description"]
      : ["removed description from goal", title];

    if (page === "goal") {
      return feedTitle(activity, ...message);
    } else {
      return feedTitle(activity, ...message);
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const data = content(activity);
    const { mentionedPersonLookup } = useRichEditorHandlers();

    const rawDescription = data.newDescription ?? data.goal?.description;
    if (!rawDescription) return null;

    const description = typeof rawDescription === "string" ? safeParseDescription(rawDescription) : rawDescription;

    if (!description) return null;

    return <Summary content={description} characterCount={200} mentionedPersonLookup={mentionedPersonLookup} />;
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

  NotificationTitle({ activity }: { activity: Activity }) {
    const data = content(activity);

    if (data.hasDescription) {
      return `Goal "${data.goal?.name || data.goalName}" description was updated`;
    } else {
      return `Goal "${data.goal?.name || data.goalName}" description was removed`;
    }
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    const data = content(activity);
    return data.goal?.name || data.goalName;
  },
};

function content(activity: Activity): ActivityContentGoalDescriptionChanged {
  return activity.content as ActivityContentGoalDescriptionChanged;
}

function safeParseDescription(description: string) {
  try {
    return JSON.parse(description);
  } catch (_err) {
    return null;
  }
}

export default GoalDescriptionChanged;
