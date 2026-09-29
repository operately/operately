import * as React from "react";

import type { ActivityContentProjectMilestoneCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, commentPath, milestoneCommentLink, milestoneLink, projectLink } from "../feedItemLinks";
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

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    const { comment, commentAction, milestone, project } = content(activity);
    let sentence: string;
    switch (commentAction) {
      case "none":
        sentence =
          page === "project"
            ? i18n.t("{{author}} <action>commented</action> on the <milestone>{{milestoneName}}</milestone> milestone")
            : i18n.t(
                "{{author}} <action>commented</action> on the <milestone>{{milestoneName}}</milestone> milestone in the <project>{{projectName}}</project> project",
              );
        break;
      case "complete":
        sentence =
          page === "project"
            ? i18n.t("{{author}} completed the <milestone>{{milestoneName}}</milestone> milestone")
            : i18n.t(
                "{{author}} completed the <milestone>{{milestoneName}}</milestone> milestone in the <project>{{projectName}}</project> project",
              );
        break;
      case "reopen":
        sentence =
          page === "project"
            ? i18n.t("{{author}} re-opened the <milestone>{{milestoneName}}</milestone> milestone")
            : i18n.t(
                "{{author}} re-opened the <milestone>{{milestoneName}}</milestone> milestone in the <project>{{projectName}}</project> project",
              );
        break;
      default:
        throw new Error("Unknown action: " + commentAction);
    }
    return (
      <Trans
        defaults={sentence}
        values={{
          author: activityAuthorName(activity),
          milestoneName: milestone?.title ?? i18n.t("a milestone"),
          projectName: project.name,
        }}
        components={{
          action: milestoneCommentLink(paths, milestone, comment),
          milestone: milestone ? milestoneLink(paths, milestone) : <React.Fragment />,
          project: projectLink(paths, project),
        }}
      />
    );
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
          return i18n.t("Re: {{title}}", { title });
        case "complete":
          return i18n.t("Closed milestone: {{title}}", { title });
        case "reopen":
          return i18n.t("Re-opened milestone: {{title}}", { title });
        default:
          throw new Error("Unknown action: " + commentAction);
      }
    } else {
      switch (commentAction) {
        case "none":
          return i18n.t("Commented on a milestone");
        case "complete":
          return i18n.t("Closed a milestone");
        case "reopen":
          return i18n.t("Re-opened a milestone");
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
