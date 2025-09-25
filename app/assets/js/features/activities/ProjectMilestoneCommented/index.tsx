import * as React from "react";

import type { ActivityContentProjectMilestoneCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { Summary } from "@/components/RichContent";

import { feedTitle, milestoneLink, projectLink } from "../feedItemLinks";

const ProjectMilestoneCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    return paths.projectMilestonePath(content(activity).milestone!.id!);
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
    const { milestone, project } = content(activity);
    const milestoneName = milestone ? milestoneLink(milestone) : "a milestone";
    const what = didWhat(content(activity).commentAction!);

    if (page === "project") {
      return feedTitle(activity, what, "the", milestoneName, "milestone");
    } else {
      return feedTitle(activity, what, "the", milestoneName, "milestone in the", projectLink(project), "project");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const comment = content(activity).comment!;
    const commentMessage = JSON.parse(comment.content!)["message"];

    if (commentMessage) {
      return <Summary jsonContent={commentMessage} characterCount={200} />;
    } else {
      return null;
    }
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
    const action = content(activity).commentAction!;
    const title = content(activity).milestone!.title!;

    return didWhat(action) + " " + title;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectMilestoneCommented {
  return activity.content as ActivityContentProjectMilestoneCommented;
}

export default ProjectMilestoneCommented;

function didWhat(action: string): string {
  switch (action) {
    case "none":
      return "commented on";
    case "complete":
      return "completed";
    case "reopen":
      return "re-opened";
    default:
      throw new Error("Unknown action: " + action);
  }
}
