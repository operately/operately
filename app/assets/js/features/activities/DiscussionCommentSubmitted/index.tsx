import type { ActivityContentDiscussionCommentSubmitted } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { usePaths } from "@/routes/paths";
import React from "react";
import { Link, Summary } from "turboui";
import { commentPath, commentedLink, feedTitle } from "../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { parseCommentContent } from "@/models/comments";

const DiscussionCommentSubmitted: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { comment, discussion, space } = content(activity);

    if (!discussion) {
      return paths.spacePath(space.id);
    }

    return commentPath(paths.discussionPath(discussion.id), comment);
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
    const { comment, discussion, space } = content(activity);

    const discussionPath = discussion ? paths.discussionPath(discussion.id) : null;
    const action = discussionPath ? commentedLink(discussionPath, comment) : "commented";
    const activityLink =
      discussionPath && discussion ? <Link to={discussionPath}>{discussion.title}</Link> : "a message";

    if (page === "space") {
      return feedTitle(activity, action, "on", activityLink);
    } else {
      return feedTitle(activity, action, "on", activityLink, "in", space.name, "space");
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

    return "Re: " + discussion?.title || "a message";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).space.name;
  },
};

function content(activity: Activity): ActivityContentDiscussionCommentSubmitted {
  return activity.content as ActivityContentDiscussionCommentSubmitted;
}

export default DiscussionCommentSubmitted;
