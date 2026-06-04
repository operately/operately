import React from "react";

import type { ActivityContentResourceHubDocumentCreated } from "@/api";
import type { Activity } from "@/models/activities";
import * as People from "@/models/people";

import { assertPresent } from "@/utils/assertions";
import { documentLink, feedTitle } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";
import { resourceHubParentScope } from "../resourceHubActivityContext";
import { Summary } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

const ResourceHubDocumentCreating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    const document = content(activity).document;
    assertPresent(document?.id, "document.id must be present in ResourceHubDocumentCreated activity content");

    return paths.resourceHubDocumentPath(document.id);
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
    const data = content(activity);
    const document = data.document;
    const copiedDocument = data.copiedDocument;

    if (copiedDocument && document) {
      return "Created a copy of " + copiedDocument.name + " and named it " + document.name;
    } else if (document) {
      return "Added: " + document.name;
    } else {
      return "Added a document";
    }
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).resourceHub?.name || null;
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

  if (page === "space" || page === "project") {
    return feedTitle(activity, "created a copy of", copiedDocument, "and named it", document);
  } else {
    return feedTitle(
      activity,
      "created a copy of",
      copiedDocument,
      "and named it",
      document,
      ...resourceHubParentScope(data, page),
    );
  }
}

function ItemCreatedTitle(activity: Activity, page: string) {
  const data = content(activity);

  const document = data.document ? documentLink(data.document) : "a document";

  if (page === "space" || page === "project") {
    return feedTitle(activity, "created a document:", document);
  } else {
    return feedTitle(activity, "created a document", ...resourceHubParentScope(data, page, ":"), document);
  }
}
