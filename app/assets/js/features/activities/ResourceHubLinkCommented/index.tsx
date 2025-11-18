import React from "react";

import type { ActivityContentResourceHubLinkCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { feedTitle, linkLink, spaceLink } from "../feedItemLinks";
import { Summary } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { parseCommentContent } from "@/models/comments";

const ResourceHubLinkCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { link, space } = content(activity);

    if (link) {
      return paths.resourceHubLinkPath(link.id);
    }

    return paths.resourceHubPath(space.id);
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
    const data = content(activity);
    const space = spaceLink(data.space);
    let link: any = "a link"

    if (data.link) {
      link = linkLink(data.link);
    }

    if (page === "space") {
      return feedTitle(activity, "commented on", link);
    } else {
      return feedTitle(activity, "commented on", link, "in the", space, "space");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { mentionedPersonLookup } = useRichEditorHandlers();
    const comment = content(activity).comment;
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
    const data = content(activity);

    return "Re: " + data.link?.name || "a link";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).link?.name || "a link";
  },
};

function content(activity: Activity): ActivityContentResourceHubLinkCommented {
  return activity.content as ActivityContentResourceHubLinkCommented;
}

export default ResourceHubLinkCommented;
