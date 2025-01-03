import React from "react";
import * as People from "@/models/people";

import type { Activity } from "@/models/activities";
import type { ActivityContentResourceHubLinkCreated } from "@/api";
import type { ActivityHandler } from "../interfaces";
import { Paths } from "@/routes/paths";
import { feedTitle, linkLink, resourceHubLink, spaceLink } from "../feedItemLinks";

const ResourceHubLinkCreated: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity) {
    return Paths.resourceHubLinkPath(content(activity).link?.id!);
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

    const space = spaceLink(data.space!);
    const resourceHub = resourceHubLink(data.resourceHub!);
    const link = linkLink(data.link!);

    if (page === "space") {
      return feedTitle(activity, "added a link:", link);
    } else {
      return feedTitle(activity, "added a link to", resourceHub, "in the", space, "space:", link);
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const link = content(activity).link!;
    return <div>{link.url}</div>;
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-center";
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    return People.firstName(activity.author!) + " added a link: " + content(activity).link?.name;
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentResourceHubLinkCreated {
  return activity.content as ActivityContentResourceHubLinkCreated;
}

export default ResourceHubLinkCreated;
