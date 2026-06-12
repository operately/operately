import React from "react";

import type { ActivityContentResourceHubDocumentCreated } from "@/api";
import type { Activity } from "@/models/activities";
import * as People from "@/models/people";

import { documentLink, feedTitle } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { Summary } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { resourceHubLocationName, resourceHubPathOrParent, visibleParentDescriptor } from "../resourceHubActivity";

const ResourceHubDocumentCreating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const data = content(activity);

    if (data.document?.id) {
      return paths.resourceHubDocumentPath(data.document.id);
    }

    return resourceHubPathOrParent(paths, data);
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
    const { document } = content(activity);
    const { mentionedPersonLookup } = useRichEditorHandlers({ scope: People.NoneSearchScope });

    return <Summary content={document?.content} characterCount={160} mentionedPersonLookup={mentionedPersonLookup} />;
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
    const document = content(activity).document;
    const copiedDocument = content(activity).copiedDocument;
    const documentName = document?.name ?? "a document";

    if (copiedDocument) {
      return (
        "Created a copy of " +
        copiedDocument.name +
        " and named it " +
        documentName
      );
    } else {
      return "Added: " + documentName;
    }
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return resourceHubLocationName(content(activity));
  },
};

function content(activity: Activity): ActivityContentResourceHubDocumentCreated {
  return activity.content as ActivityContentResourceHubDocumentCreated;
}

export default ResourceHubDocumentCreating;

function ItemCopiedTitle(activity: Activity, page: string) {
  const data = content(activity);

  const document = data.document ? documentLink(data.document) : "a document";
  const copiedDocument = data.copiedDocument ? documentLink(data.copiedDocument) : "a document";
  const parent = visibleParentDescriptor(page, data);

  if (!parent) {
    return feedTitle(activity, "created a copy of", copiedDocument, "and named it", document);
  }

  return feedTitle(activity, "created a copy of", copiedDocument, "and named it", document, "in the", parent.link, parent.label);
}

function ItemCreatedTitle(activity: Activity, page: string) {
  const data = content(activity);

  const document = data.document ? documentLink(data.document) : "a document";
  const parent = visibleParentDescriptor(page, data);

  if (!parent) {
    return feedTitle(activity, "created a document:", document);
  }

  return feedTitle(activity, "created a document in the", parent.link, `${parent.label}:`, document);
}
