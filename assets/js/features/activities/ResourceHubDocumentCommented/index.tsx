import * as People from "@/models/people";

import type { Activity } from "@/models/activities";
import type { ActivityContentResourceHubDocumentCommented } from "@/api";
import type { ActivityHandler } from "../interfaces";

import { Paths } from "@/routes/paths";
import { Summary } from "@/components/RichContent";
import React from "react";
import { Link } from "@/components/Link";
import { feedTitle } from "../feedItemLinks";

const ResourceHubDocumentCommented: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity): string {
    return Paths.resourceHubDocumentPath(content(activity).document!.id!);
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
    const document = content(activity).document!;

    const path = Paths.resourceHubDocumentPath(document.id!);
    const activityLink = <Link to={path}>{document.name}</Link>;

    return feedTitle(activity, "commented on", activityLink);
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
    return People.firstName(activity.author!) + " commented on: " + content(activity).document!.name!;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).document!.name!;
  },
};

function content(activity: Activity): ActivityContentResourceHubDocumentCommented {
  return activity.content as ActivityContentResourceHubDocumentCommented;
}

export default ResourceHubDocumentCommented;