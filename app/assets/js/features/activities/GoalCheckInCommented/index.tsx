import * as React from "react";
import * as People from "@/models/people";

import type { ActivityContentGoalCheckInCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { feedTitle, goalLink } from "./../feedItemLinks";
import { Paths } from "@/routes/paths";
import { Link } from "turboui";
import { Summary } from "@/components/RichContent";
import { assertPresent } from "@/utils/assertions";

const GoalUpdateCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity): string {
    return Paths.goalCheckInPath(content(activity).update?.id!);
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
    const data = content(activity);

    assertPresent(data.goal, "Goal must be present in activity content");
    assertPresent(data.update, "Update must be present in activity content");
    assertPresent(data.update.id, "Update ID must be present in activity content");

    const checkInPath = Paths.goalCheckInPath(data.update.id);
    const checkInLink = <Link to={checkInPath}>Check-In</Link>;

    if (page === "goal") {
      return feedTitle(activity, "commented on a", checkInLink);
    } else {
      return feedTitle(activity, "commented on a", checkInLink, " in the ", goalLink(data.goal), "goal");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const comment = content(activity).comment!;
    const commentContent = JSON.parse(comment.content!)["message"];

    return <Summary jsonContent={commentContent} characterCount={200} />;
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
    return People.firstName(activity.author!) + " commented on the goal check-in";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).goal!.name!;
  },
};

function content(activity: Activity): ActivityContentGoalCheckInCommented {
  return activity.content as ActivityContentGoalCheckInCommented;
}

export default GoalUpdateCommented;
