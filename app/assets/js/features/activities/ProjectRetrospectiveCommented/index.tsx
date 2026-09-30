import * as React from "react";

import type { ActivityContentProjectRetrospectiveCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import { Link, Summary } from "turboui";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, commentPath, commentedLink, projectLink } from "./../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { parseCommentContent } from "@/models/comments";

const ProjectRetrospectiveCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { comment, project } = content(activity);

    return commentPath(paths.projectRetrospectivePath(project.id), comment);
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
    const { comment, project } = content(activity);

    const retrospectivePath = paths.projectRetrospectivePath(project.id);
    const action = commentedLink(retrospectivePath, comment);
    const retrospectiveLink = <Link to={retrospectivePath}>{null}</Link>;
    const components = {
      action: typeof action === "string" ? <React.Fragment /> : action,
      retrospective: retrospectiveLink,
      project: projectLink(paths, project),
    };
    const values = { author: activityAuthorName(activity), projectName: project.name };

    if (page === "project") {
      return (
        <Trans
          i18nKey="{{author}} <action>commented</action> on <retrospective>Retrospective</retrospective>"
          values={values}
          components={components}
        />
      );
    } else {
      return (
        <Trans
          i18nKey="{{author}} <action>commented</action> on <retrospective>Retrospective</retrospective> in the <project>{{projectName}}</project> project"
          values={values}
          components={components}
        />
      );
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { comment } = content(activity);
    const { mentionedPersonLookup } = useRichEditorHandlers();
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
    return i18n.t("Re: project retrospective");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project.name;
  },
};

function content(activity: Activity): ActivityContentProjectRetrospectiveCommented {
  return activity.content as ActivityContentProjectRetrospectiveCommented;
}

export default ProjectRetrospectiveCommented;
