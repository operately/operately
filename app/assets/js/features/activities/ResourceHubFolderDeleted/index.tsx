import * as People from "@/models/people";

import type { Activity } from "@/models/activities";
import type { ActivityContentResourceHubFolderDeleted } from "@/api";
import type { ActivityHandler } from "../interfaces";
import { Paths } from "@/routes/paths";
import { feedTitle, resourceHubLink, spaceLink } from "../feedItemLinks";

const ResourceHubFolderDeleted: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity) {
    return Paths.resourceHubPath(content(activity).resourceHub!.id!);
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
    const folder = data.folder!;

    if (page === "space") {
      return feedTitle(activity, `deleted the "${folder.name}" folder from`, resourceHub);
    } else {
      return feedTitle(activity, `deleted the "${folder.name}" folder from`, resourceHub, "in the", space, "space");
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
    return People.firstName(activity.author!) + " deleted a folder: " + content(activity).folder!.name!;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).resourceHub!.name!;
  },
};

function content(activity: Activity): ActivityContentResourceHubFolderDeleted {
  return activity.content as ActivityContentResourceHubFolderDeleted;
}

export default ResourceHubFolderDeleted;
