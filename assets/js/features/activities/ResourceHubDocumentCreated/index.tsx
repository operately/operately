import React from "react";
import * as People from "@/models/people";
import type { Activity } from "@/models/activities";
import type { ActivityContentResourceHubDocumentCreated } from "@/api";
import type { ActivityHandler } from "../interfaces";
import { Paths } from "@/routes/paths";
import { documentLink, feedTitle, spaceLink } from "../feedItemLinks";
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

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    const data = content(activity);
    const document = documentLink(data.document!);

    const coreMessage = data.copiedDocument
      ? ["created a copy of", documentLink(data.copiedDocument), "and named it", document]
      : ["created a document:", document];

    if (page !== "space") {
      const space = spaceLink(data.space!);
      return feedTitle(activity, ...coreMessage, "in the", space, "space");
    }

    return feedTitle(activity, ...coreMessage);
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
    const document = content(activity).document!;
    const copiedDocument = content(activity).copiedDocument;

    if (copiedDocument) {
      return (
        People.firstName(activity.author!) +
        " created a copy of " +
        copiedDocument.name +
        " and named it " +
        document.name
      );
    } else {
      return People.firstName(activity.author!) + " added: " + document.name!;
    }
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).resourceHub!.name!;
  },
};

function content(activity: Activity): ActivityContentResourceHubDocumentCreated {
  return activity.content as ActivityContentResourceHubDocumentCreated;
}

export default ResourceHubDocumentCreating;
