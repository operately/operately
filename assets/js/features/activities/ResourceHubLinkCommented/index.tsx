import React from "react";
import * as People from "@/models/people";

import type { Activity } from "@/models/activities";
import type { ActivityContentResourceHubLinkCommented } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { Paths } from "@/routes/paths";
import { Summary } from "@/components/RichContent";
import { feedTitle, linkLink, spaceLink } from "../feedItemLinks";
import { assertPresent } from "@/utils/assertions";

const ResourceHubLinkCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity): string {
    const data = content(activity);
    assertPresent(data.link?.id, "link.id must be present in activity");

    return Paths.resourceHubLinkPath(data.link.id);
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
    const comment = content(activity).comment!;
    const commentContent = JSON.parse(comment.content!)["message"];
    return <Summary jsonContent={commentContent} characterCount={200} />;
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

    return People.firstName(activity.author!) + " commented on: " + data.link.name;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).link!.name!;
  },
};

function content(activity: Activity): ActivityContentResourceHubLinkCommented {
  return activity.content as ActivityContentResourceHubLinkCommented;
}

export default ResourceHubLinkCommented;
