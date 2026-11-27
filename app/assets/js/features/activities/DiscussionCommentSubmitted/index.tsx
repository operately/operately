import type { ActivityContentDiscussionCommentSubmitted } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler, FeedItemProps } from "../interfaces";

import React from "react";
import { Link, Summary } from "turboui";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, commentPath, commentedLink, projectLink } from "../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { parseCommentContent } from "@/models/comments";

const DiscussionCommentSubmitted: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { comment, discussion, space, project } = content(activity);

    if (!discussion) {
      if (project) return paths.projectPath(project.id);
      return space ? paths.spacePath(space.id) : paths.homePath();
    }

    return commentPath(
      project ? paths.projectDiscussionPath(discussion.id) : paths.discussionPath(discussion.id),
      comment,
    );
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
    const { comment, discussion, space, project } = content(activity);

    const discussionPath =
      discussion && (project ? paths.projectDiscussionPath(discussion.id) : paths.discussionPath(discussion.id));
    const action = discussionPath ? commentedLink(discussionPath, comment) : "commented";
    const activityLink = discussionPath && discussion ? <Link to={discussionPath}>{null}</Link> : <React.Fragment />;
    const values = { author: activityAuthorName(activity), title: discussion?.title, spaceName: space?.name };
    const components = { action: typeof action === "string" ? <React.Fragment /> : action, discussion: activityLink };

    if (project && discussion && page !== "project") {
      return (
        <Trans
          i18nKey="{{author}} <action>commented</action> on <discussion>{{title}}</discussion> in the <project>{{projectName}}</project> project"
          values={{ ...values, projectName: project.name }}
          components={{ ...components, project: projectLink(paths, project) }}
        />
      );
    }

    if (!space || page === "space") {
      return discussion ? (
        <Trans
          i18nKey="{{author}} <action>commented</action> on <discussion>{{title}}</discussion>"
          values={values}
          components={components}
        />
      ) : (
        <Trans i18nKey="{{author}} commented on a message" values={values} />
      );
    } else {
      return discussion ? (
        <Trans
          i18nKey="{{author}} <action>commented</action> on <discussion>{{title}}</discussion> in {{spaceName}} space"
          values={values}
          components={components}
        />
      ) : (
        <Trans i18nKey="{{author}} commented on a message in {{spaceName}} space" values={values} />
      );
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { comment } = content(activity);
    const commentContent = parseCommentContent(comment?.content);
    const { mentionedPersonLookup } = useRichEditorHandlers();

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

  NotificationTitle({ activity }: { activity: Activity }) {
    const { discussion } = content(activity);

    return i18n.t("Re: {{title}}", { title: String(discussion?.title) });
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    const { project, space } = content(activity);
    return project?.name ?? space?.name ?? null;
  },
};

function content(activity: Activity): ActivityContentDiscussionCommentSubmitted {
  return activity.content as ActivityContentDiscussionCommentSubmitted;
}

export default DiscussionCommentSubmitted;
