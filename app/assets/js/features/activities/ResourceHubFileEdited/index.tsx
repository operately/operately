import React from "react";
import * as People from "@/models/people";

import type { Activity } from "@/models/activities";
import type { ActivityContentResourceHubFileEdited } from "@/api";
import type { ActivityHandler } from "../interfaces";
import { Paths } from "@/routes/paths";
import { feedTitle, fileLink, spaceLink } from "../feedItemLinks";
import { Summary } from "@/components/RichContent";

const ResourceHubFileEdited: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity) {
    const file = content(activity).file!;
    return Paths.resourceHubFilePath(file.id!);
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
    const file = fileLink(data.file!);

    if (page === "space") {
      return feedTitle(activity, "edited a file:", file);
    } else {
      return feedTitle(activity, "edited a file in the", space, "space:", file);
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    return <Summary jsonContent={content(activity).file!.description!} characterCount={160} />;
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
    return People.firstName(activity.author!) + " edited a file: " + content(activity).file!.name!;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).resourceHub!.name!;
  },
};

function content(activity: Activity): ActivityContentResourceHubFileEdited {
  return activity.content as ActivityContentResourceHubFileEdited;
}

export default ResourceHubFileEdited;
