import React from "react";
import * as People from "@/models/people";
import type { Activity } from "@/models/activities";
import type { ActivityContentResourceHubDocumentCreated } from "@/api";
import type { ActivityHandler } from "../interfaces";
import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { feedTitle } from "../feedItemLinks";
import { Summary } from "@/components/RichContent";

const ResourceHubDocumentCreating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(_activity: Activity): string {
    return Paths.resourceHubDocumentPath(content(_activity).document!.id!);
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
    const copiedDocument = content(activity).copiedDocument;

    const path = Paths.resourceHubDocumentPath(document.id!);
    const link = <Link to={path}>{document.name}</Link>;

    if (copiedDocument) {
      const copiedDocumentPath = Paths.resourceHubDocumentPath(copiedDocument.id!);
      const copiedDocumentLink = <Link to={copiedDocumentPath}>{copiedDocument.name}</Link>;

      return feedTitle(activity, "created a copy of", copiedDocumentLink, "and named it", link);
    } else {
      return feedTitle(activity, "added the", link, "document");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    return <Summary jsonContent={content(activity).document!.content!} characterCount={160} />;
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
    return People.firstName(activity.author!) + " added: " + content(activity).document!.name!;
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).resourceHub!.name!;
  },
};

function content(activity: Activity): ActivityContentResourceHubDocumentCreated {
  return activity.content as ActivityContentResourceHubDocumentCreated;
}

export default ResourceHubDocumentCreating;
