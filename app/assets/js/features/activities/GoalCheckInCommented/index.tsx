import * as React from "react";

import type { ActivityContentGoalCheckInCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { Link, Summary } from "turboui";
import { feedTitle, goalLink } from "./../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const GoalUpdateCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    return paths.goalCheckInPath(content(activity).update?.id!);
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

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    const paths = usePaths();
    const data = content(activity);

    assertPresent(data.goal, "Goal must be present in activity content");
    assertPresent(data.update, "Update must be present in activity content");
    assertPresent(data.update.id, "Update ID must be present in activity content");

    const checkInPath = paths.goalCheckInPath(data.update.id);
    const checkInLink = <Link to={checkInPath}>Check-In</Link>;

    if (page === "goal") {
      return feedTitle(activity, "commented on a", checkInLink);
    } else {
      return feedTitle(activity, "commented on a", checkInLink, " in the ", goalLink(data.goal), "goal");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { mentionedPersonLookup } = useRichEditorHandlers();
    const { comment } = content(activity);
    const commentContent = comment?.content ? JSON.parse(comment.content)["message"] : "";

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
    return "Re: goal check-in";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalCheckInCommented {
  return activity.content as ActivityContentGoalCheckInCommented;
}

export default GoalUpdateCommented;
