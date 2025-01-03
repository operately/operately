import React from "react";
import * as People from "@/models/people";

import type { Activity } from "@/models/activities";
import type { ActivityContentResourceHubFileCreated } from "@/api";
import type { ActivityHandler } from "../interfaces";
import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { feedTitle, resourceHubLink, spaceLink } from "../feedItemLinks";

const ResourceHubFileCreated: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(_activity: Activity) {
    return Paths.resourceHubFilePath(content(_activity).fileId!);
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
    const path = Paths.resourceHubFilePath(data.fileId!);
    const file = <Link to={path}>{data.fileName}</Link>;

    if (page === "space") {
      return feedTitle(activity, "added a file:", file);
    } else {
      return feedTitle(activity, "added a file to", resourceHub, "in the", space, "space:", file);
    }
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
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
    return People.firstName(activity.author!) + " added a file: " + content(activity).fileName;
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentResourceHubFileCreated {
  return activity.content as ActivityContentResourceHubFileCreated;
}

export default ResourceHubFileCreated;
