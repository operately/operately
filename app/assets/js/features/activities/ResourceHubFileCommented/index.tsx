import * as People from "@/models/people";

import type { ActivityContentResourceHubFileCommented } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { Summary } from "@/components/RichContent";

import { assertPresent } from "@/utils/assertions";
import React from "react";
import { feedTitle, fileLink, spaceLink } from "../feedItemLinks";

const ResourceHubFileCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const data = content(activity);
    assertPresent(data.file?.id, "file must be present in activity");

    return paths.resourceHubFilePath(data.file.id);
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

    assertPresent(data.file, "file must be present in activity");
    assertPresent(data.space, "space must be present in activity");

    const file = fileLink(data.file);
    const space = spaceLink(data.space);

    if (page === "space") {
      return feedTitle(activity, "commented on", file);
    } else {
      return feedTitle(activity, "commented on", file, "in the", space, "space");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const data = content(activity);
    assertPresent(data.comment?.content, "comment must be present in activity");

    const commentContent = JSON.parse(data.comment.content)["message"];
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
    return "Re: " + content(activity).file!.name!;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).file!.name!;
  },
};

function content(activity: Activity): ActivityContentResourceHubFileCommented {
  return activity.content as ActivityContentResourceHubFileCommented;
}

export default ResourceHubFileCommented;
