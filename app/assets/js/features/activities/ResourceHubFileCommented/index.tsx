import React from "react";
import * as People from "@/models/people";

import type { ActivityContentResourceHubFileCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { usePaths } from "@/routes/paths";
import { commentPath, commentedLink, feedTitle, fileLink } from "../feedItemLinks";
import { Summary } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { parseCommentContent } from "@/models/comments";
import { resourceHubParentScope } from "../resourceHubActivityContext";

const ResourceHubFileCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { file, resourceHub, comment } = content(activity);

    if (file) {
      return commentPath(paths.resourceHubFilePath(file.id), comment);
    }

    return resourceHub?.id ? paths.resourceHubPath(resourceHub.id) : paths.homePath();
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
    const data = content(activity);
    let action: any = "commented";
    let file: any = "a file";

    if (data.file) {
      file = fileLink(data.file);
    }

    if (data.file?.id) {
      action = commentedLink(paths.resourceHubFilePath(data.file.id), data.comment);
    }

    if (page === "space" || page === "project") {
      return feedTitle(activity, action, "on", file);
    } else {
      return feedTitle(activity, action, "on", file, ...resourceHubParentScope(data, page));
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { comment } = content(activity);
    const { mentionedPersonLookup } = useRichEditorHandlers({ scope: People.NoneSearchScope });
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

  NotificationTitle({ activity }: { activity: Activity }) {
    return "Re: " + (content(activity).file?.name || "a file");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).file?.name || "a file";
  },
};

function content(activity: Activity): ActivityContentResourceHubFileCommented {
  return activity.content as ActivityContentResourceHubFileCommented;
}

export default ResourceHubFileCommented;
