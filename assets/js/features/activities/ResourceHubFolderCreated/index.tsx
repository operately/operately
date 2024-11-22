import * as React from "react";
import * as People from "@/models/people";

import type { Activity } from "@/models/activities";
import type { ActivityContentResourceHubFolderCreated } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { assertPresent } from "@/utils/assertions";
import { feedTitle } from "../feedItemLinks";

const ResourceHubFolderCreated: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity): string {
    const folder = content(activity).folder;
    assertPresent(folder?.id, "folder.id must be present in ResourceHubFolderCreated activity content");

    return Paths.resourceHubFolderPath(folder.id);
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

  FeedItemTitle({ activity }: { activity: Activity; page: any }) {
    const resourceHub = content(activity).resourceHub;
    const folder = content(activity).folder;
    assertPresent(folder?.id, "folder.id must be present in ResourceHubFolderCreated activity content");
    assertPresent(resourceHub?.id, "resourceHub.id must be present in ResourceHubFolderCreated activity content");

    const path = Paths.resourceHubFolderPath(folder.id);
    const link = <Link to={path}>{folder.name}</Link>;
    const hubPath = Paths.resourceHubPath(resourceHub.id);
    const hubLink = <Link to={hubPath}>{resourceHub.name}</Link>;

    return feedTitle(activity, "created the", link, "folder in", hubLink);
  },

  FeedItemContent({}: { activity: Activity }) {
    return <></>;
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
    return People.firstName(activity.author!) + " created folder: " + content(activity).folder!.name!;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).folder!.name!;
  },
};

function content(activity: Activity): ActivityContentResourceHubFolderCreated {
  return activity.content as ActivityContentResourceHubFolderCreated;
}

export default ResourceHubFolderCreated;
