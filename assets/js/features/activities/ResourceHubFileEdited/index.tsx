import React from "react";
import * as People from "@/models/people";

import type { Activity } from "@/models/activities";
import type { ActivityContentResourceHubFileEdited } from "@/api";
import type { ActivityHandler } from "../interfaces";
import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { feedTitle } from "../feedItemLinks";
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

  FeedItemTitle({ activity }: { activity: Activity }) {
    const file = content(activity).file!;

    const path = Paths.resourceHubFilePath(file.id!);
    const link = <Link to={path}>{file.name}</Link>;

    return feedTitle(activity, "edited a file:", link);
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
