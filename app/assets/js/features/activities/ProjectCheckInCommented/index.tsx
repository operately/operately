import * as React from "react";

import type { ActivityContentProjectCheckInCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { Summary } from "turboui";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, commentPath, commentedLink, projectCheckInLink, projectLink } from "./../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { parseCommentContent } from "@/models/comments";

const ProjectCheckInCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { checkIn, comment, project } = content(activity);

    if (checkIn?.id) {
      return commentPath(paths.projectCheckInPath(checkIn.id), comment);
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
    const { checkIn, comment, project } = content(activity);
    const action = checkIn?.id ? commentedLink(paths.projectCheckInPath(checkIn.id), comment) : "commented";
    const checkInLink = projectCheckInLink(paths, checkIn);
    const components = {
      action: typeof action === "string" ? <React.Fragment /> : action,
      checkIn: typeof checkInLink === "string" ? <React.Fragment /> : checkInLink,
      project: projectLink(paths, project),
    };
    const values = { author: activityAuthorName(activity), projectName: project.name };

    if (page === "project") {
      return (
        <Trans
          i18nKey="{{author}} <action>commented</action> on <checkIn>Check-In</checkIn>"
          values={values}
          components={components}
        />
      );
    } else {
      return (
        <Trans
          i18nKey="{{author}} <action>commented</action> on <checkIn>Check-In</checkIn> in the <project>{{projectName}}</project> project"
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

  NotificationTitle(_props: { activity: Activity }) {
    return i18n.t("Re: project check-in");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project.name;
  },
};

function content(activity: Activity): ActivityContentProjectCheckInCommented {
  return activity.content as ActivityContentProjectCheckInCommented;
}

export default ProjectCheckInCommented;
