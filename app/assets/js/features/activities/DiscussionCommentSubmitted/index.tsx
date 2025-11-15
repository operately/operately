import type { ActivityContentDiscussionCommentSubmitted } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { usePaths } from "@/routes/paths";
import React from "react";
import { Link, Summary } from "turboui";
import { feedTitle } from "../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const DiscussionCommentSubmitted: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { discussion, space } = content(activity);

    if (!discussion) {
      return paths.spacePath(space.id);
    }

    return paths.discussionPath(discussion.id);
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
    const { discussion, space, title } = content(activity);

    const activityLink = discussion ? <Link to={paths.discussionPath(discussion.id)}>{discussion.title}</Link> : title;

    if (page === "space") {
      return feedTitle(activity, "commented on", activityLink);
    } else {
      return feedTitle(activity, "commented on", activityLink, "in", space.name, "space");
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
    const { title } = content(activity);

    return "Re: " + title;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).space.name;
  },
};

function content(activity: Activity): ActivityContentDiscussionCommentSubmitted {
  return activity.content as ActivityContentDiscussionCommentSubmitted;
}

function parseCommentContent(content: string | null | undefined) {
  if (!content || content.trim() === "") {
    return null;
  }

  try {
    const parsed = JSON.parse(content);
    return parsed?.message || "";
  } catch (error) {
    console.error("Failed to parse comment content:", error);
    return null;
  }
}

export default DiscussionCommentSubmitted;
