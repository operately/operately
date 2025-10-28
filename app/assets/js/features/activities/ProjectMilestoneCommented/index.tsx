import * as React from "react";

import type { ActivityContentProjectMilestoneCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { feedTitle, milestoneLink, projectLink } from "../feedItemLinks";
import { Summary } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const ProjectMilestoneCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { milestone, project } = content(activity);

    if (milestone) {
      return paths.projectMilestonePath(milestone.id);
    } else {
      return paths.projectPath(project.id);
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

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    const { milestone, project } = content(activity);
    const milestoneName = milestone ? milestoneLink(milestone) : "a milestone";
    const what = didWhat(content(activity).commentAction);

    if (page === "project") {
      return feedTitle(activity, what, "the", milestoneName, "milestone");
    } else {
      return feedTitle(activity, what, "the", milestoneName, "milestone in the", projectLink(project), "project");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { comment } = content(activity);
    const commentMessage = comment?.content ? JSON.parse(comment.content)["message"] : null;
    const { mentionedPersonLookup } = useRichEditorHandlers();

    if (commentMessage) {
      return <Summary content={commentMessage} characterCount={200} mentionedPersonLookup={mentionedPersonLookup} />;
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
    const { milestone, commentAction } = content(activity);
    const title = milestone?.title;

    if (title) {
      switch (commentAction) {
        case "none":
          return "Re: " + title;
        case "complete":
          return "Closed milestone: " + title;
        case "reopen":
          return "Re-opened milestone: " + title;
        default:
          throw new Error("Unknown action: " + commentAction);
      }
    } else {
      switch (commentAction) {
        case "none":
          return "Commented on a milestone";
        case "complete":
          return "Closed a milestone";
        case "reopen":
          return "Re-opened a milestone";
        default:
          throw new Error("Unknown action: " + commentAction);
      }
    }
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project.name;
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
