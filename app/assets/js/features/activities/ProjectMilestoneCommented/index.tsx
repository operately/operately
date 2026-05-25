import * as React from "react";

import type { ActivityContentProjectMilestoneCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { commentPath, feedTitle, milestoneCommentLink, milestoneLink, projectLink } from "../feedItemLinks";
import { Summary } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { parseCommentContent } from "@/models/comments";

const ProjectMilestoneCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { comment, milestone, project } = content(activity);

    if (milestone) {
      return commentPath(paths.projectMilestonePath(milestone.id), comment);
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
    const { comment, commentAction, milestone, project } = content(activity);
    const milestoneName = milestone ? milestoneLink(milestone) : "a milestone";
    const action = activityAction(commentAction, milestone, comment);

    if (page === "project") {
      return feedTitle(activity, action.verb, action.objectPrefix, milestoneName, "milestone");
    } else {
      return feedTitle(
        activity,
        action.verb,
        action.objectPrefix,
        milestoneName,
        "milestone in the",
        projectLink(project),
        "project",
      );
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { comment } = content(activity);
    const commentContent = parseCommentContent(comment?.content);
    const { mentionedPersonLookup } = useRichEditorHandlers();

    if (commentContent) {
      return <Summary content={commentContent} characterCount={200} mentionedPersonLookup={mentionedPersonLookup} />;
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

function activityAction(
  action: string,
  milestone: ActivityContentProjectMilestoneCommented["milestone"],
  comment: ActivityContentProjectMilestoneCommented["comment"],
): { verb: string | JSX.Element; objectPrefix: string } {
  switch (action) {
    case "none":
      return { verb: milestoneCommentLink(milestone, comment), objectPrefix: "on the" };
    case "complete":
      return { verb: "completed", objectPrefix: "the" };
    case "reopen":
      return { verb: "re-opened", objectPrefix: "the" };
    default:
      throw new Error("Unknown action: " + action);
  }
}
