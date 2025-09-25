import React from "react";

import type { ActivityContentResourceHubLinkCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { assertPresent } from "@/utils/assertions";
import { feedTitle, linkLink, spaceLink } from "../feedItemLinks";
import { Summary } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const ResourceHubLinkCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const data = content(activity);
    assertPresent(data.link?.id, "link.id must be present in activity");

    return paths.resourceHubLinkPath(data.link.id);
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

    const link = linkLink(data.link!);
    const space = spaceLink(data.space!);

    if (page === "space") {
      return feedTitle(activity, "commented on", link);
    } else {
      return feedTitle(activity, "commented on", link, "in the", space, "space");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const { mentionedPersonLookup } = useRichEditorHandlers();
    const comment = content(activity).comment!;
    const commentContent = JSON.parse(comment.content!)["message"];

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
    assertPresent(data.link?.name, "link.name must be present in activity");

    return "Re: " + data.link.name;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).link!.name!;
  },
};

function content(activity: Activity): ActivityContentResourceHubLinkCommented {
  return activity.content as ActivityContentResourceHubLinkCommented;
}

export default ResourceHubLinkCommented;
