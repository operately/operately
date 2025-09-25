import type { ActivityContentResourceHubFileDeleted } from "@/api";
import type { Activity } from "@/models/activities";

import { assertPresent } from "@/utils/assertions";
import { feedTitle, resourceHubLink, spaceLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const ResourceHubFileDeleted: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity) {
    const data = content(activity);
    assertPresent(data.resourceHub?.id, "resourceHub must be present in activity");

    return paths.resourceHubPath(content(activity).resourceHub!.id!);
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
    const file = content(activity).file!;

    if (page === "space") {
      return feedTitle(activity, `deleted "${file.name}" from`, resourceHub);
    } else {
      return feedTitle(activity, `deleted "${file.name}" from`, resourceHub, "in the", space, "space");
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
    return "Deleted a file: " + content(activity).file!.name!;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).resourceHub!.name!;
  },
};

function content(activity: Activity): ActivityContentResourceHubFileDeleted {
  return activity.content as ActivityContentResourceHubFileDeleted;
}

export default ResourceHubFileDeleted;
