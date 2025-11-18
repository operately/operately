import React from "react";
import * as People from "@/models/people";

import type { ActivityContentResourceHubDocumentCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { documentLink, feedTitle, spaceLink } from "../feedItemLinks";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { Summary } from "turboui";
import { parseCommentContent } from "@/models/comments";

const ResourceHubDocumentCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const { document, space } = content(activity);

    if (!document) {
      return paths.resourceHubPath(space.id);
    }
    return paths.resourceHubDocumentPath(document.id);
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
    let document: any = "a document";

    if (data.document) {
      document = documentLink(data.document);
    }

    if (page === "space") {
      return feedTitle(activity, "commented on", document);
    } else {
      return feedTitle(activity, "commented on", document, "in the", space, "space");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { comment } = content(activity);
    const commentContent = parseCommentContent(comment?.content);
    const { mentionedPersonLookup } = useRichEditorHandlers({ scope: People.NoneSearchScope });

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
    return "Re: " + (content(activity).document?.name || "a document");
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).document?.name || "a document";
  },
};

function content(activity: Activity): ActivityContentResourceHubDocumentCommented {
  return activity.content as ActivityContentResourceHubDocumentCommented;
}

export default ResourceHubDocumentCommented;
