import * as React from "react";

import type { Activity } from "@/models/activities";
import type { ActivityContentProjectMilestoneCommented } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { Link } from "@/components/Link";
import { Summary } from "@/components/RichContent";
import { feedTitle, projectLink } from "../feedItemLinks";
import { Paths } from "@/routes/paths";

const ProjectMilestoneCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(_activity: Activity): string {
    throw new Error("Not implemented");
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
    const project = content(activity).project!;
    const milestone = content(activity).milestone!;
    const path = Paths.projectMilestoneUrl(project.id!, milestone.id!);
    const link = <Link to={path}>{milestone!.title!}</Link>;
    const what = didWhat(content(activity).commentAction!);

    if (page === "project") {
      return feedTitle(activity, what, "the", link, "milestone");
    } else {
      return feedTitle(activity, what, "the", link, "milestone in the", projectLink(project), "project");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const comment = content(activity).comment!;
    const commentMessage = JSON.parse(comment.content!)["message"];

    return <Summary jsonContent={commentMessage} characterCount={200} />;
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  CommentNotificationTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
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
