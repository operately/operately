import type { ActivityContentResourceHubDocumentCreated } from "@/api";
import { Summary } from "@/components/RichContent";
import type { Activity } from "@/models/activities";
import React from "react";
import { documentLink, feedTitle, spaceLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const ResourceHubDocumentCreating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, _activity: Activity): string {
    return paths.resourceHubDocumentPath(content(_activity).document!.id!);
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
    if (content(activity).copiedDocument) {
      return ItemCopiedTitle(activity, page);
    } else {
      return ItemCreatedTitle(activity, page);
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    return <Summary jsonContent={content(activity).document!.content!} characterCount={160} />;
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
    const document = content(activity).document!;
    const copiedDocument = content(activity).copiedDocument;

    if (copiedDocument) {
      return (
        "Created a copy of " +
        copiedDocument.name +
        " and named it " +
        document.name
      );
    } else {
      return "Added: " + document.name!;
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

function ItemCopiedTitle(activity: Activity, page: string) {
  const data = content(activity);

  const space = spaceLink(data.space!);
  const document = documentLink(data.document!);
  const copiedDocument = documentLink(data.copiedDocument!);

  if (page === "space") {
    return feedTitle(activity, "created a copy of", copiedDocument, "and named it", document);
  } else {
    return feedTitle(activity, "created a copy of", copiedDocument, "and named it", document, "in the", space, "space");
  }
}

function ItemCreatedTitle(activity: Activity, page: string) {
  const data = content(activity);

  const space = spaceLink(data.space!);
  const document = documentLink(data.document!);

  if (page === "space") {
    return feedTitle(activity, "created a document:", document);
  } else {
    return feedTitle(activity, "created a document in the", space, "space:", document);
  }
}
