import React from "react";
import type { ActivityContentGoalDescriptionChanged } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, goalLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
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

  FeedItemTitle({ activity, paths }: FeedItemProps) {
    const data = content(activity);
    const goal = data.goal ? goalLink(paths, data.goal) : <React.Fragment />;
    const sentence = data.goal
      ? data.hasDescription
        ? i18n.t("{{author}} updated goal <goal>{{goalName}}</goal> description")
        : i18n.t("{{author}} removed description from goal <goal>{{goalName}}</goal>")
      : data.hasDescription
        ? i18n.t('{{author}} updated goal "{{goalName}}" description')
        : i18n.t('{{author}} removed description from goal "{{goalName}}"');
    return (
      <Trans
        defaults={sentence}
        values={{ author: activityAuthorName(activity), goalName: data.goal?.name ?? data.goalName }}
        components={{ goal }}
      />
    );
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
      return i18n.t('Goal "{{goalName}}" description was updated', { goalName: data.goal?.name || data.goalName });
    } else {
      return i18n.t('Goal "{{goalName}}" description was removed', { goalName: data.goal?.name || data.goalName });
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
